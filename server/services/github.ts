// GitHub service —— 接入官方 Search Repositories JSON API（不解析 HTML，不使用 token）。
//
// 上游接口：GET https://api.github.com/search/repositories
//   query: q=created:>=<近7天日期>  sort=stars  order=desc  per_page=20
//   含义：检索最近 7 天创建、按 star 降序的仓库，近似「近期热门趋势」。
// 返回 JSON 结构（仅列出本文件用到的字段，便于日后接口变化时维护）：
//   {
//     total_count: 12345,
//     items: [                              // 仓库数组（本文件主要数据源）
//       {
//         full_name: "owner/repo",          // → HotItem.title
//         html_url: "https://github.com/owner/repo",  // → HotItem.url
//         stargazers_count: 3200,           // star 数 → HotItem.heat
//         forks_count: 120                  // fork 数 → 补充进 heat 文案
//       }
//     ]
//   }
//
// 字段消费小结：full_name → title，html_url → url，stargazers_count/forks_count → heat，
//             数组下标 → rank，tags 恒为 []。
// 说明：未认证请求受 GitHub 限流（每 IP 每分钟约 10 次 search），正常走 hot:all 缓存即可，
//      被限流（HTTP 403/429）时抛错，由 fetchPlatform 降级为 status:"error"，不影响其他平台。

import type { HotItem } from "../types/index.js";

interface GithubRepo {
  full_name?: string;
  html_url?: string;
  stargazers_count?: number;
  forks_count?: number;
}

interface GithubSearchResponse {
  items?: GithubRepo[];
  message?: string; // 限流/错误时 GitHub 返回的说明
}

/** 取最近 N 天的日期字符串（YYYY-MM-DD），用于 created 过滤 */
function sinceDate(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

/** 组合 star/fork 为展示文案 */
function formatHeat(stars?: number, forks?: number): string | undefined {
  const parts: string[] = [];
  if (typeof stars === "number" && stars >= 0) parts.push(`★ ${stars}`);
  if (typeof forks === "number" && forks > 0) parts.push(`⑂ ${forks}`);
  return parts.length > 0 ? parts.join("  ") : undefined;
}

export async function fetchGithub(): Promise<HotItem[]> {
  const q = encodeURIComponent(`created:>=${sinceDate(7)}`);
  const api = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=20`;

  let res: Response;
  try {
    res = await fetch(api, {
      headers: {
        // GitHub API 要求带 User-Agent；Accept 指定 v3 JSON；不带任何 token
        "User-Agent": "mini-hot-hub/0.1 (learning project)",
        Accept: "application/vnd.github+json",
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`GitHub 趋势请求失败：${reason}`);
  }

  if (!res.ok) {
    // 限流时 GitHub 多返回 403/429，body 带 message
    let detail = "";
    try {
      const body = (await res.json()) as GithubSearchResponse;
      if (body?.message) detail = `：${body.message}`;
    } catch {
      /* 忽略 body 解析失败 */
    }
    throw new Error(`GitHub 接口返回非 200：HTTP ${res.status}${detail}`);
  }

  let json: GithubSearchResponse;
  try {
    json = (await res.json()) as GithubSearchResponse;
  } catch {
    throw new Error("GitHub 响应不是合法 JSON，上游格式可能已变化");
  }

  const repos = json?.items;
  if (!Array.isArray(repos) || repos.length === 0) {
    throw new Error("GitHub 趋势数据为空或结构变化（缺少 items 数组）");
  }

  const items: HotItem[] = [];
  for (const repo of repos) {
    const title = repo.full_name?.trim();
    const url = repo.html_url?.trim();
    if (!title || !url) continue; // 跳过缺名或缺链接的条目
    items.push({
      rank: items.length + 1, // 重新编号，保证 1..N 连续不重复
      title,
      heat: formatHeat(repo.stargazers_count, repo.forks_count),
      url,
      tags: [],
    });
  }

  if (items.length < 10) {
    throw new Error(`GitHub 趋势有效条目不足 10 条（实际 ${items.length} 条），疑似上游异常`);
  }

  return items;
}
