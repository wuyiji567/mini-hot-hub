// B站 service —— 接入真实「热门」JSON 接口（不解析 HTML）。
//
// 上游接口：GET https://api.bilibili.com/x/web-interface/popular?ps=30&pn=1
// 返回 JSON 结构（仅列出本文件用到的字段，便于日后接口变化时维护）：
//   {
//     code: 0,                              // 0 表示成功，非 0 为错误
//     data: {
//       list: [                             // 热门视频数组（本文件主要数据源）
//         {
//           title: "视频标题",              // → HotItem.title
//           bvid: "BV1xx411c7mD",           // → 构造 HotItem.url
//           stat: { view: 1234567 }         // 播放量 → HotItem.heat（格式化为「万」）
//         }
//       ]
//     }
//   }
// 链接构造：https://www.bilibili.com/video/<bvid>
//
// 字段消费小结：title → title，stat.view → heat，bvid → url，数组下标 → rank，tags 恒为 []。

import type { HotItem } from "../types/index.js";

const POPULAR_API = "https://api.bilibili.com/x/web-interface/popular?ps=30&pn=1";

interface BiliVideo {
  title?: string;
  bvid?: string;
  stat?: { view?: number };
}

interface BiliPopularResponse {
  code?: number;
  data?: { list?: BiliVideo[] };
}

/** 播放量格式化为展示文案，如 1234567 → "123.5万" */
function formatHeat(view?: number): string | undefined {
  if (typeof view !== "number" || !Number.isFinite(view) || view <= 0) return undefined;
  if (view >= 10000) return `${(view / 10000).toFixed(1)}万`;
  return String(view);
}

export async function fetchBilibili(): Promise<HotItem[]> {
  let res: Response;
  try {
    res = await fetch(POPULAR_API, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.bilibili.com/",
        Accept: "application/json, text/plain, */*",
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`B站热门请求失败：${reason}`);
  }

  if (!res.ok) {
    throw new Error(`B站热门接口返回非 200：HTTP ${res.status}`);
  }

  let json: BiliPopularResponse;
  try {
    json = (await res.json()) as BiliPopularResponse;
  } catch {
    throw new Error("B站热门响应不是合法 JSON，上游格式可能已变化");
  }

  if (json?.code !== 0) {
    throw new Error(`B站热门接口业务错误：code=${json?.code}`);
  }

  const list = json?.data?.list;
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("B站热门数据为空或结构变化（缺少 data.list 数组）");
  }

  const items: HotItem[] = [];
  for (const raw of list) {
    const title = raw.title?.trim();
    const bvid = raw.bvid?.trim();
    if (!title || !bvid) continue; // 跳过缺标题或缺 bvid 的条目
    items.push({
      rank: items.length + 1, // 重新编号，保证 1..N 连续不重复
      title,
      heat: formatHeat(raw.stat?.view),
      url: `https://www.bilibili.com/video/${bvid}`,
      tags: [],
    });
  }

  if (items.length < 10) {
    throw new Error(`B站热门有效条目不足 10 条（实际 ${items.length} 条），疑似上游异常`);
  }

  return items;
}
