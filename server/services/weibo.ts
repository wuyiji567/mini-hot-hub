// 微博 service —— 接入真实热搜 JSON 接口（不解析 HTML）。
//
// 上游接口：GET https://weibo.com/ajax/side/hotSearch
// 返回 JSON 结构（仅列出本文件用到的字段，便于日后接口变化时维护）：
//   {
//     ok: 1,
//     data: {
//       realtime: [                     // 实时热搜榜数组（本文件主要数据源）
//         {
//           word: "标题文本",            // → HotItem.title
//           word_scheme: "#标题#",       // 可选，带话题井号的写法，无则用 word 拼接
//           num: 1234567,               // 热度数值 → 格式化为 HotItem.heat（如 "123.5万"）
//           realpos: 1,                 // 上游真实排名（可能缺失，缺失时用数组下标兜底）
//           is_ad: 1,                   // 广告标记，存在则跳过该条
//           flag_desc / label_name      // 分类/标签描述（本阶段不消费，tags 统一为 []）
//         }
//       ]
//     }
//   }
// 链接构造：https://s.weibo.com/weibo?q=<URL编码的 #话题#>
//
// 字段消费小结：word → title，num → heat，realpos/下标 → rank，q=话题 → url，tags 恒为 []。

import type { HotItem } from "../types/index.js";

const HOT_SEARCH_API = "https://weibo.com/ajax/side/hotSearch";

interface WeiboRealtimeItem {
  word?: string;
  word_scheme?: string;
  num?: number;
  realpos?: number;
  is_ad?: number;
}

interface WeiboHotSearchResponse {
  ok?: number;
  data?: {
    realtime?: WeiboRealtimeItem[];
  };
}

/** 把热度数值格式化为展示文案，如 1234567 → "123.5万" */
function formatHeat(num?: number): string | undefined {
  if (typeof num !== "number" || !Number.isFinite(num) || num <= 0) return undefined;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  return String(num);
}

/** 构造微博话题搜索链接 */
function buildUrl(word: string, wordScheme?: string): string {
  const query = wordScheme && wordScheme.length > 0 ? wordScheme : `#${word}#`;
  return `https://s.weibo.com/weibo?q=${encodeURIComponent(query)}`;
}

export async function fetchWeibo(): Promise<HotItem[]> {
  let res: Response;
  try {
    res = await fetch(HOT_SEARCH_API, {
      headers: {
        // 合理的 UA + Referer，模拟浏览器侧边热搜请求；不携带任何 cookie/token
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://weibo.com/",
        Accept: "application/json, text/plain, */*",
      },
      // 10s 超时，避免上游挂起拖慢整体响应
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`微博热搜请求失败：${reason}`);
  }

  if (!res.ok) {
    throw new Error(`微博热搜接口返回非 200：HTTP ${res.status}`);
  }

  let json: WeiboHotSearchResponse;
  try {
    json = (await res.json()) as WeiboHotSearchResponse;
  } catch {
    throw new Error("微博热搜响应不是合法 JSON，上游格式可能已变化");
  }

  const realtime = json?.data?.realtime;
  if (!Array.isArray(realtime) || realtime.length === 0) {
    throw new Error("微博热搜数据为空或结构变化（缺少 data.realtime 数组）");
  }

  const items: HotItem[] = [];
  for (const raw of realtime) {
    if (raw.is_ad) continue; // 跳过广告条目
    const title = raw.word?.trim();
    if (!title) continue; // 跳过无标题条目
    items.push({
      rank: items.length + 1, // 重新编号，保证 1..N 连续不重复
      title,
      heat: formatHeat(raw.num),
      url: buildUrl(title, raw.word_scheme),
      tags: [],
    });
  }

  if (items.length < 10) {
    throw new Error(`微博热搜有效条目不足 10 条（实际 ${items.length} 条），疑似上游异常`);
  }

  return items;
}
