// 知乎 service —— 接入真实热榜 JSON 接口（不解析 HTML）。
//
// 上游接口：GET https://api.zhihu.com/topstory/hot-lists/total?limit=50
// 返回 JSON 结构（仅列出本文件用到的字段，便于日后接口变化时维护）：
//   {
//     data: [                              // 热榜条目数组（本文件主要数据源）
//       {
//         target: {
//           id: 123456789,                 // 问题 id → 构造 HotItem.url
//           title: "问题标题",             // → HotItem.title
//           url: "https://api.zhihu.com/questions/123456789"  // 可选，含 id，兜底解析
//         },
//         detail_text: "1234 万热度"        // 热度文案 → HotItem.heat
//       }
//     ]
//   }
// 链接构造：https://www.zhihu.com/question/<id>
//
// 字段消费小结：target.title → title，detail_text → heat，target.id → rank(下标)/url，tags 恒为 []。

import type { HotItem } from "../types/index.js";

const HOT_LIST_API = "https://api.zhihu.com/topstory/hot-lists/total?limit=50";

interface ZhihuTarget {
  id?: number | string;
  title?: string;
  url?: string;
}

interface ZhihuHotItem {
  target?: ZhihuTarget;
  detail_text?: string;
}

interface ZhihuHotListResponse {
  data?: ZhihuHotItem[];
}

/** 从 target 提取问题 id：优先 target.id，否则从 target.url 里抠数字 */
function extractQuestionId(target: ZhihuTarget): string | undefined {
  if (target.id !== undefined && target.id !== null && String(target.id).length > 0) {
    return String(target.id);
  }
  const match = target.url?.match(/questions?\/(\d+)/);
  return match?.[1];
}

export async function fetchZhihu(): Promise<HotItem[]> {
  let res: Response;
  try {
    res = await fetch(HOT_LIST_API, {
      headers: {
        // 合理 UA + Referer；不携带任何 cookie/token
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.zhihu.com/hot",
        Accept: "application/json, text/plain, */*",
      },
      // 10s 超时，避免上游挂起拖慢整体响应
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`知乎热榜请求失败：${reason}`);
  }

  if (!res.ok) {
    throw new Error(`知乎热榜接口返回非 200：HTTP ${res.status}`);
  }

  let json: ZhihuHotListResponse;
  try {
    json = (await res.json()) as ZhihuHotListResponse;
  } catch {
    throw new Error("知乎热榜响应不是合法 JSON，上游格式可能已变化");
  }

  const data = json?.data;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("知乎热榜数据为空或结构变化（缺少 data 数组）");
  }

  const items: HotItem[] = [];
  for (const raw of data) {
    const target = raw.target;
    const title = target?.title?.trim();
    if (!target || !title) continue; // 跳过无标题条目（如运营卡片）

    const id = extractQuestionId(target);
    if (!id) continue; // 无法构造链接的条目跳过

    const heat = raw.detail_text?.trim();
    items.push({
      rank: items.length + 1, // 重新编号，保证 1..N 连续不重复
      title,
      heat: heat && heat.length > 0 ? heat : undefined,
      url: `https://www.zhihu.com/question/${id}`,
      tags: [],
    });
  }

  if (items.length < 10) {
    throw new Error(`知乎热榜有效条目不足 10 条（实际 ${items.length} 条），疑似上游异常`);
  }

  return items;
}
