// 澎湃新闻 service —— 接入真实热榜 JSON（不解析 HTML）。
//
// 上游接口：GET https://cache.thepaper.cn/contentapi/wwwIndex/rightSidebar
// 返回 JSON 结构（仅列出本文件用到的字段，便于日后接口变化时维护）：
//   {
//     data: {
//       hotNews: [                         // 热门新闻数组（本文件主要数据源）
//         {
//           name: "新闻标题",              // → HotItem.title
//           contId: "33326061"             // 内容 id → 构造 HotItem.url
//         }
//       ]
//     }
//   }
// 链接构造：https://www.thepaper.cn/newsDetail_forward_<contId>
//
// 字段消费小结：name → title，contId → url，数组下标 → rank，tags 恒为 []。
// 说明：澎湃 hotNews 无统一热度字段，heat 留空（前端缺失则隐藏）。

import type { HotItem } from "../types/index.js";

const SIDEBAR_API = "https://cache.thepaper.cn/contentapi/wwwIndex/rightSidebar";

interface ThepaperNews {
  name?: string;
  contId?: string | number;
}

interface ThepaperResponse {
  data?: {
    hotNews?: ThepaperNews[];
  };
}

export async function fetchThepaper(): Promise<HotItem[]> {
  let res: Response;
  try {
    res = await fetch(SIDEBAR_API, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.thepaper.cn/",
        Accept: "application/json, text/plain, */*",
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`澎湃热榜请求失败：${reason}`);
  }

  if (!res.ok) {
    throw new Error(`澎湃热榜接口返回非 200：HTTP ${res.status}`);
  }

  let json: ThepaperResponse;
  try {
    json = (await res.json()) as ThepaperResponse;
  } catch {
    throw new Error("澎湃热榜响应不是合法 JSON，上游格式可能已变化");
  }

  const hotNews = json?.data?.hotNews;
  if (!Array.isArray(hotNews) || hotNews.length === 0) {
    throw new Error("澎湃热榜数据为空或结构变化（缺少 data.hotNews 数组）");
  }

  const items: HotItem[] = [];
  for (const raw of hotNews) {
    const title = raw.name?.trim();
    const contId = raw.contId != null ? String(raw.contId) : "";
    if (!title || !contId) continue; // 跳过缺标题或缺 contId 的条目
    items.push({
      rank: items.length + 1, // 重新编号，保证 1..N 连续不重复
      title,
      heat: undefined, // 澎湃无统一热度字段
      url: `https://www.thepaper.cn/newsDetail_forward_${contId}`,
      tags: [],
    });
  }

  if (items.length < 10) {
    throw new Error(`澎湃热榜有效条目不足 10 条（实际 ${items.length} 条），疑似上游异常`);
  }

  return items;
}
