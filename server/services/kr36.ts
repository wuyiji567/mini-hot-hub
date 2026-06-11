// 36氪 service —— 接入真实热榜 JSON（POST 网关，不解析 HTML）。
//
// 上游接口：POST https://gateway.36kr.com/api/mis/nav/home/nav/rank/hot
//   body: { partner_id: "wap", param: { siteId: 1, platformId: 2 }, timestamp: Date.now() }
// 返回 JSON 结构（仅列出本文件用到的字段，便于日后接口变化时维护）：
//   {
//     code: 0,                             // 0 成功
//     data: {
//       hotRankList: [                     // 热榜数组（本文件主要数据源）
//         {
//           templateMaterial: {
//             widgetTitle: "标题",         // → HotItem.title
//             itemId: 3841823029447170,    // 内容 id → 构造 HotItem.url
//             statRead: 12345              // 阅读量 → HotItem.heat
//           }
//         }
//       ]
//     }
//   }
// 链接构造：https://www.36kr.com/p/<itemId>
//
// 字段消费小结：widgetTitle → title，statRead → heat，itemId → url，数组下标 → rank，tags 恒为 []。
// 备注：业务内部统一用 kr36 标识；本接口不返回 "36kr" 字样，无需额外映射。

import type { HotItem } from "../types/index.js";

const HOT_RANK_API = "https://gateway.36kr.com/api/mis/nav/home/nav/rank/hot";

interface Kr36Material {
  widgetTitle?: string;
  itemId?: string | number;
  statRead?: number;
}

interface Kr36RankItem {
  templateMaterial?: Kr36Material;
}

interface Kr36Response {
  code?: number;
  data?: {
    hotRankList?: Kr36RankItem[];
  };
}

/** 阅读量格式化，如 123456 → "12.3万" */
function formatHeat(read?: number): string | undefined {
  if (typeof read !== "number" || !Number.isFinite(read) || read <= 0) return undefined;
  if (read >= 10000) return `${(read / 10000).toFixed(1)}万`;
  return String(read);
}

export async function fetchKr36(): Promise<HotItem[]> {
  let res: Response;
  try {
    res = await fetch(HOT_RANK_API, {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://36kr.com/",
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
      },
      body: JSON.stringify({
        partner_id: "wap",
        param: { siteId: 1, platformId: 2 },
        timestamp: Date.now(),
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`36氪热榜请求失败：${reason}`);
  }

  if (!res.ok) {
    throw new Error(`36氪热榜接口返回非 200：HTTP ${res.status}`);
  }

  let json: Kr36Response;
  try {
    json = (await res.json()) as Kr36Response;
  } catch {
    throw new Error("36氪热榜响应不是合法 JSON，上游格式可能已变化");
  }

  if (json?.code !== 0) {
    throw new Error(`36氪热榜接口业务错误：code=${json?.code}`);
  }

  const list = json?.data?.hotRankList;
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("36氪热榜数据为空或结构变化（缺少 data.hotRankList 数组）");
  }

  const items: HotItem[] = [];
  for (const raw of list) {
    const m = raw.templateMaterial;
    const title = m?.widgetTitle?.trim();
    const itemId = m?.itemId != null ? String(m.itemId) : "";
    if (!title || !itemId) continue; // 跳过缺标题或缺 itemId 的条目
    items.push({
      rank: items.length + 1, // 重新编号，保证 1..N 连续不重复
      title,
      heat: formatHeat(m?.statRead),
      url: `https://www.36kr.com/p/${itemId}`,
      tags: [],
    });
  }

  if (items.length < 10) {
    throw new Error(`36氪热榜有效条目不足 10 条（实际 ${items.length} 条），疑似上游异常`);
  }

  return items;
}
