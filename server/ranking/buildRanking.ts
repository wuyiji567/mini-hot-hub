// 综合热榜算法 —— 与 TECH_DESIGN.md 一致：
// score = max(0, 50 - rank) + (出现平台数 - 1) * 15 + sourceWeight
// 去重：标题归一化后完全相同视为同一事件。宁可少合并，不要错误合并。

import type { HotPlatform, RankingItem, Source } from "../types/index.js";

const SOURCE_WEIGHT: Record<Source, number> = {
  weibo: 5,
  zhihu: 5,
  bilibili: 4,
  github: 4,
  thepaper: 3,
  kr36: 3,
  hupu: 3,
  toutiao: 3,
  douyin: 3,
};

/** 去空格、标点后小写，用于粗略去重 */
function normalizeTitle(title: string): string {
  return title.replace(/[\s\p{P}]/gu, "").toLowerCase();
}

interface Agg {
  title: string;
  url: string;
  platforms: Set<Source>;
  bestRank: number;
}

export function buildRanking(sources: HotPlatform[]): RankingItem[] {
  const map = new Map<string, Agg>();

  for (const platform of sources) {
    if (platform.status !== "ok") continue;
    for (const item of platform.items) {
      const key = normalizeTitle(item.title);
      const existing = map.get(key);
      if (existing) {
        existing.platforms.add(platform.source);
        if (item.rank < existing.bestRank) {
          existing.bestRank = item.rank;
          existing.url = item.url;
        }
      } else {
        map.set(key, {
          title: item.title,
          url: item.url,
          platforms: new Set([platform.source]),
          bestRank: item.rank,
        });
      }
    }
  }

  const scored = Array.from(map.values()).map((agg) => {
    const platforms = Array.from(agg.platforms);
    const rankScore = Math.max(0, 50 - agg.bestRank);
    const platformBonus = (platforms.length - 1) * 15;
    const sourceWeight = Math.max(...platforms.map((s) => SOURCE_WEIGHT[s]));
    const score = rankScore + platformBonus + sourceWeight;
    return { agg, platforms, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 20).map((entry, idx) => ({
    rank: idx + 1,
    title: entry.agg.title,
    url: entry.agg.url,
    heat: `综合热度 ${entry.score}`,
    platforms: entry.platforms,
    score: entry.score,
    trend: entry.score >= 60 ? "up" : entry.score >= 45 ? "flat" : "down",
  }));
}
