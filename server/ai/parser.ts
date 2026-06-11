// AI 返回结果解析 + 校验。只接受合法 JSON；标签限定固定枚举；字段缺失/超长/非法一律过滤或兜底。
// 任何解析失败都抛出清晰错误，由上层降级，绝不让 /api/hot 崩溃。

import type { AIFeatured, AIRecommend, Source } from "../types/index.js";
import { VALID_SOURCES } from "../types/index.js";

/** 固定分类标签枚举（11 类，含「汽车」） */
export const TAG_ENUM = [
  "科技",
  "娱乐",
  "体育",
  "财经",
  "社会",
  "游戏",
  "教育",
  "汽车",
  "国际",
  "生活",
  "其他",
] as const;

const TAG_SET = new Set<string>(TAG_ENUM);
const MAX_TAGS = 2;
const MAX_REASON_LEN = 120;
const MAX_TITLE_LEN = 60;

/** 解析 AI 文本为 JSON 对象，失败抛错（容忍 ```json 包裹） */
export function parseJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("AI 返回内容不是合法 JSON");
  }
}

/** 截断过长文案 */
export function truncate(text: unknown, max: number): string {
  const s = typeof text === "string" ? text.trim() : "";
  return s.length > max ? s.slice(0, max) : s;
}

/**
 * 清洗标签：仅保留固定枚举内、去重、最多 2 个；
 * 支持「科技 · AI」这类带后缀的写法（取「·」前主分类做枚举校验，整串作展示）。
 * 全部非法时兜底为 ["其他"]。
 */
export function sanitizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return ["其他"];
  const out: string[] = [];
  for (const t of raw) {
    if (typeof t !== "string") continue;
    const main = t.split("·")[0]?.trim();
    if (main && TAG_SET.has(main) && !out.includes(main)) {
      out.push(main);
      if (out.length >= MAX_TAGS) break;
    }
  }
  return out.length > 0 ? out : ["其他"];
}

/** 校验单个展示用 tag 字符串（如「科技 · AI」），非法则返回「其他」 */
export function sanitizeTagLabel(raw: unknown): string {
  if (typeof raw !== "string") return "其他";
  const main = raw.split("·")[0]?.trim();
  return main && TAG_SET.has(main) ? raw.trim() : "其他";
}

function isSource(v: unknown): v is Source {
  return typeof v === "string" && (VALID_SOURCES as string[]).includes(v);
}

/** 解析 C1 标签结果：{ results: [{ index, tags }] } → Map<index, tags[]> */
export function parseTagResults(json: unknown): Map<number, string[]> {
  const map = new Map<number, string[]>();
  const results = (json as { results?: unknown })?.results;
  if (!Array.isArray(results)) return map;
  for (const r of results) {
    const idx = (r as { index?: unknown })?.index;
    if (typeof idx !== "number" || !Number.isInteger(idx)) continue;
    map.set(idx, sanitizeTags((r as { tags?: unknown }).tags));
  }
  return map;
}

/** 解析 C2 今日最热 + 热点速览，过滤缺字段项 */
export function parseFeatured(json: unknown): AIFeatured[] {
  const obj = json as { featured?: unknown; quick?: unknown };
  const out: AIFeatured[] = [];
  const take = (arr: unknown, section: "featured" | "quick") => {
    if (!Array.isArray(arr)) return;
    for (const raw of arr) {
      const r = raw as Record<string, unknown>;
      const eventTitle = truncate(r.eventTitle, MAX_TITLE_LEN);
      const hotReason = truncate(r.hotReason, MAX_REASON_LEN);
      if (!eventTitle || !hotReason) continue; // 缺必要字段丢弃
      out.push({
        eventTitle,
        hotReason,
        tag: sanitizeTagLabel(r.tag),
        imageUrl: "", // 由 ai/index.ts 按分类填充，AI 不产图
        platforms: [],
        heat: truncate(r.heat, 30),
        trend: truncate(r.trend, 20),
        section,
      });
    }
  };
  take(obj?.featured, "featured");
  take(obj?.quick, "quick");
  return out;
}

/** 解析 C3 个性推荐，过滤缺字段项 */
export function parseRecommend(json: unknown): AIRecommend[] {
  const arr = (json as { recommendations?: unknown })?.recommendations;
  if (!Array.isArray(arr)) return [];
  const out: AIRecommend[] = [];
  for (const raw of arr) {
    const r = raw as Record<string, unknown>;
    const eventTitle = truncate(r.eventTitle, MAX_TITLE_LEN);
    const aiReason = truncate(r.aiReason, MAX_REASON_LEN);
    if (!eventTitle || !aiReason) continue;
    const reasonType = r.reasonType === "similar" ? "similar" : "follow";
    out.push({
      eventTitle,
      reasonType,
      reasonLabel: truncate(r.reasonLabel, 20) || (reasonType === "follow" ? "你关注" : "相似主题"),
      aiReason,
      imageUrl: "", // 由 ai/index.ts 按分类填充
      platform: isSource(r.platform) ? r.platform : "weibo",
      platformCount: typeof r.platformCount === "number" ? r.platformCount : 1,
      heat: truncate(r.heat, 30),
      tags: sanitizeTags(r.tags),
    });
  }
  return out;
}
