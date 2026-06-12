// 轻量 OG 图片提取：抓取来源页 HTML，解析 og:image / twitter:image。
// 仅 http/https、带 3s 超时、基础 SSRF 防护；任何失败返回 null（绝不抛错）。
// 结果（含 null）写内存缓存，避免反复抓取同一页面。

import { getCache, setCache } from "./cache.js";

const FETCH_TIMEOUT_MS = 3000;
const OG_CACHE_TTL = 6 * 60 * 60; // 6 小时（秒）
const MAX_HTML_BYTES = 512 * 1024; // 只读前 512KB，<head> 足够
const UA =
  "Mozilla/5.0 (compatible; MiniHotHubBot/1.0; +https://github.com/wuyiji567/mini-hot-hub)";

/** 仅允许 http/https */
function isHttpUrl(u: URL): boolean {
  return u.protocol === "http:" || u.protocol === "https:";
}

/**
 * 基础 SSRF 防护：拒绝 localhost / 回环 / 内网 / 链路本地 / 保留网段。
 * 注意：这是基础防护（不做 DNS 解析校验），配合"仅 http/https + 超时 + 校验最终响应地址"使用。
 */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, ""); // 去掉 IPv6 方括号

  if (h === "localhost" || h === "0.0.0.0" || h.endsWith(".local") || h.endsWith(".internal")) {
    return true;
  }

  // IPv6 字面量
  if (h.includes(":")) {
    if (h === "::1") return true; // 回环
    if (h.startsWith("fe80:")) return true; // 链路本地
    if (h.startsWith("fc") || h.startsWith("fd")) return true; // 唯一本地地址 ULA
    return false;
  }

  // IPv4 字面量
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 0 || a === 10 || a === 127) return true; // 本网络 / 私有 A / 回环
    if (a === 169 && b === 254) return true; // 链路本地
    if (a === 172 && b >= 16 && b <= 31) return true; // 私有 B
    if (a === 192 && b === 168) return true; // 私有 C
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  }
  return false;
}

/** 把解析出的图片地址转绝对 URL 并校验 http/https + SSRF 黑名单；非法返回 null */
function toAbsoluteImage(raw: string, base: URL): string | null {
  try {
    const abs = new URL(decodeEntities(raw.trim()), base);
    if (!isHttpUrl(abs)) return null;
    // 图片地址同样过 SSRF 防护：拒绝 localhost/回环/内网/.local/.internal/IPv6 本地等
    if (isBlockedHost(abs.hostname)) return null;
    return abs.toString();
  } catch {
    return null;
  }
}

/** 仅解码 URL 里常见的 HTML 实体（&amp; 等），够用即可 */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#47;/g, "/")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** 从 HTML 的 <head> 区域用正则提取 og:image / twitter:image（不引入 DOM 解析依赖） */
function parseMetaImage(html: string): string | null {
  const headEnd = html.search(/<\/head>/i);
  const head = headEnd >= 0 ? html.slice(0, headEnd) : html;

  // 兼容 property/content 两种书写顺序；优先 og:image，其次 twitter:image
  const patterns: RegExp[] = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
  ];
  for (const re of patterns) {
    const m = head.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
}

/** 读取响应体文本，但最多读 maxBytes，避免下载整页 */
async function readLimitedText(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return res.text();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }
  try {
    await reader.cancel();
  } catch {
    /* 忽略取消错误 */
  }
  return Buffer.concat(chunks).toString("utf-8");
}

/** 实际抓取 + 解析（已被 fetchOgImage 包裹缓存与异常兜底） */
async function extract(pageUrl: string): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(pageUrl);
  } catch {
    return null;
  }
  if (!isHttpUrl(url) || isBlockedHost(url.hostname)) return null;

  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
  } catch {
    return null; // 超时 / 网络错误
  }

  if (!res.ok) return null;

  // 校验最终响应地址（防跟随跳转到内网后再读取其内容）
  try {
    if (isBlockedHost(new URL(res.url).hostname)) return null;
  } catch {
    /* res.url 异常时继续，下面 content-type 仍会兜底 */
  }

  const ctype = res.headers.get("content-type") ?? "";
  if (!ctype.includes("text/html")) return null;

  const html = await readLimitedText(res, MAX_HTML_BYTES);
  const raw = parseMetaImage(html);
  if (!raw) return null;

  return toAbsoluteImage(raw, url);
}

/**
 * 提取来源页 og:image / twitter:image 绝对地址；失败返回 null。
 * 命中缓存（含曾失败的 null）直接返回，避免重复抓取。绝不抛错。
 */
export async function fetchOgImage(pageUrl: string): Promise<string | null> {
  const cacheKey = `image:og:${pageUrl}`;
  // 注意：null 也是有效缓存值；用 undefined 表示"未缓存"
  const cached = getCache<string | null>(cacheKey);
  if (cached !== undefined) return cached;

  let result: string | null = null;
  try {
    result = await extract(pageUrl);
  } catch {
    result = null; // 双保险：extract 内部已兜底
  }
  setCache(cacheKey, result, OG_CACHE_TTL);
  return result;
}
