// 今日头条 service —— 接入真实热榜 JSON（不解析 HTML）。
//
// 上游接口：GET https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc
// 返回 JSON 结构（仅列出本文件用到的字段，便于日后接口变化时维护）：
//   {
//     data: [                              // 热榜数组（本文件主要数据源）
//       {
//         Title: "事件标题",               // → HotItem.title
//         ClusterIdStr: "764859...",       // 事件 id 字符串（构造 url，避免大数精度丢失）
//         ClusterId: 764859...,            // 同上的 number 形式（超出安全整数，勿直接用）
//         Url: "https://www.toutiao.com/trending/764859.../?...",  // 上游自带链接，兜底用
//         HotValue: "4938671"              // 热度数值字符串 → HotItem.heat
//       }
//     ]
//   }
// 链接构造：https://www.toutiao.com/trending/<ClusterIdStr>/（优先），否则用上游 Url。
//
// 字段消费小结：Title → title，HotValue → heat，ClusterIdStr/Url → url，数组下标 → rank，tags 恒为 []。

import type { HotItem } from "../types/index.js";

const HOT_BOARD_API = "https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc";

interface ToutiaoItem {
  Title?: string;
  ClusterIdStr?: string;
  Url?: string;
  HotValue?: string;
}

interface ToutiaoResponse {
  data?: ToutiaoItem[];
}

/** 热度数值字符串格式化，如 "4938671" → "493.9万" */
function formatHeat(value?: string): string | undefined {
  if (!value) return undefined;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return undefined;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  return String(num);
}

/** 构造头条事件链接：优先 ClusterIdStr，其次上游自带 Url */
function buildUrl(raw: ToutiaoItem): string | undefined {
  if (raw.ClusterIdStr) return `https://www.toutiao.com/trending/${raw.ClusterIdStr}/`;
  if (raw.Url) return raw.Url;
  return undefined;
}

export async function fetchToutiao(): Promise<HotItem[]> {
  let res: Response;
  try {
    res = await fetch(HOT_BOARD_API, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.toutiao.com/",
        Accept: "application/json, text/plain, */*",
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`今日头条热榜请求失败：${reason}`);
  }

  if (!res.ok) {
    throw new Error(`今日头条热榜接口返回非 200：HTTP ${res.status}`);
  }

  let json: ToutiaoResponse;
  try {
    json = (await res.json()) as ToutiaoResponse;
  } catch {
    throw new Error("今日头条热榜响应不是合法 JSON，上游格式可能已变化");
  }

  const data = json?.data;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("今日头条热榜数据为空或结构变化（缺少 data 数组）");
  }

  const items: HotItem[] = [];
  for (const raw of data) {
    const title = raw.Title?.trim();
    const url = buildUrl(raw);
    if (!title || !url) continue; // 跳过缺标题或无法构造链接的条目
    items.push({
      rank: items.length + 1, // 重新编号，保证 1..N 连续不重复
      title,
      heat: formatHeat(raw.HotValue),
      url,
      tags: [],
    });
  }

  if (items.length < 10) {
    throw new Error(`今日头条热榜有效条目不足 10 条（实际 ${items.length} 条），疑似上游异常`);
  }

  return items;
}
