// 第一阶段本地 mock 数据：不接真实上游、不调用 AI。
// 结构严格符合 HotResponse；ranking 用与后端一致的简单算法本地生成。

import type { HotItem, HotPlatform, HotResponse, RankingItem, Source } from "../types";

// ---------- 各平台原始热搜（每个平台 ≥10 条）----------

const weiboItems: HotItem[] = [
  { rank: 1, title: "国产大模型发布会引热议", url: "https://s.weibo.com/weibo?q=国产大模型", heat: "986万", tags: [] },
  { rank: 2, title: "高考首日各地启动交通管制", url: "https://s.weibo.com/weibo?q=高考首日", heat: "812万", tags: [] },
  { rank: 3, title: "某顶流演唱会门票秒空", url: "https://s.weibo.com/weibo?q=演唱会门票", heat: "734万", tags: [] },
  { rank: 4, title: "夏季高温预警覆盖多省", url: "https://s.weibo.com/weibo?q=高温预警", heat: "601万", tags: [] },
  { rank: 5, title: "新能源车企公布销量榜", url: "https://s.weibo.com/weibo?q=新能源销量", heat: "542万", tags: [] },
  { rank: 6, title: "网友热议远程办公新政策", url: "https://s.weibo.com/weibo?q=远程办公", heat: "498万", tags: [] },
  { rank: 7, title: "国家队公布最新大名单", url: "https://s.weibo.com/weibo?q=国家队名单", heat: "455万", tags: [] },
  { rank: 8, title: "某影视剧大结局上热搜", url: "https://s.weibo.com/weibo?q=大结局", heat: "421万", tags: [] },
  { rank: 9, title: "城市夜经济迎来复苏", url: "https://s.weibo.com/weibo?q=夜经济", heat: "389万", tags: [] },
  { rank: 10, title: "高校公布今年招生计划", url: "https://s.weibo.com/weibo?q=招生计划", heat: "356万", tags: [] },
  { rank: 11, title: "多地启动消费券发放", url: "https://s.weibo.com/weibo?q=消费券", heat: "312万", tags: [] },
  { rank: 12, title: "一线城市房租出现回落", url: "https://s.weibo.com/weibo?q=房租回落", heat: "287万", tags: [] },
];

const zhihuItems: HotItem[] = [
  { rank: 1, title: "如何看待国产大模型发布会？", url: "https://www.zhihu.com/question/100001", heat: "421万", tags: [] },
  { rank: 2, title: "高考志愿填报有哪些避坑技巧？", url: "https://www.zhihu.com/question/100002", heat: "398万", tags: [] },
  { rank: 3, title: "新能源车现在值得入手吗？", url: "https://www.zhihu.com/question/100003", heat: "356万", tags: [] },
  { rank: 4, title: "远程办公会成为未来主流吗？", url: "https://www.zhihu.com/question/100004", heat: "334万", tags: [] },
  { rank: 5, title: "如何评价今年的高温天气？", url: "https://www.zhihu.com/question/100005", heat: "301万", tags: [] },
  { rank: 6, title: "程序员 35 岁之后出路在哪？", url: "https://www.zhihu.com/question/100006", heat: "289万", tags: [] },
  { rank: 7, title: "普通人如何应对通货膨胀？", url: "https://www.zhihu.com/question/100007", heat: "256万", tags: [] },
  { rank: 8, title: "为什么年轻人越来越爱露营？", url: "https://www.zhihu.com/question/100008", heat: "234万", tags: [] },
  { rank: 9, title: "AI 会取代哪些岗位？", url: "https://www.zhihu.com/question/100009", heat: "212万", tags: [] },
  { rank: 10, title: "考研和工作如何抉择？", url: "https://www.zhihu.com/question/100010", heat: "198万", tags: [] },
  { rank: 11, title: "如何系统地学习一门编程语言？", url: "https://www.zhihu.com/question/100011", heat: "176万", tags: [] },
];

const bilibiliItems: HotItem[] = [
  { rank: 1, title: "【硬核】国产大模型实测对比", url: "https://www.bilibili.com/video/BV1001", heat: "523万", tags: [] },
  { rank: 2, title: "毕业季 vlog 合集", url: "https://www.bilibili.com/video/BV1002", heat: "467万", tags: [] },
  { rank: 3, title: "新能源车深度测评", url: "https://www.bilibili.com/video/BV1003", heat: "412万", tags: [] },
  { rank: 4, title: "复刻米其林大餐", url: "https://www.bilibili.com/video/BV1004", heat: "389万", tags: [] },
  { rank: 5, title: "高考加油混剪", url: "https://www.bilibili.com/video/BV1005", heat: "367万", tags: [] },
  { rank: 6, title: "程序员的一天", url: "https://www.bilibili.com/video/BV1006", heat: "334万", tags: [] },
  { rank: 7, title: "露营装备开箱", url: "https://www.bilibili.com/video/BV1007", heat: "312万", tags: [] },
  { rank: 8, title: "国家队比赛精彩集锦", url: "https://www.bilibili.com/video/BV1008", heat: "298万", tags: [] },
  { rank: 9, title: "AI 绘画教程", url: "https://www.bilibili.com/video/BV1009", heat: "276万", tags: [] },
  { rank: 10, title: "城市夜骑路线推荐", url: "https://www.bilibili.com/video/BV1010", heat: "254万", tags: [] },
  { rank: 11, title: "高校宿舍改造大赏", url: "https://www.bilibili.com/video/BV1011", heat: "231万", tags: [] },
];

const githubItems: HotItem[] = [
  { rank: 1, title: "open-llm / awesome-models", url: "https://github.com/open-llm/awesome-models", heat: "3.2k stars today", tags: [] },
  { rank: 2, title: "vite / vite", url: "https://github.com/vitejs/vite", heat: "1.8k stars today", tags: [] },
  { rank: 3, title: "react / react", url: "https://github.com/facebook/react", heat: "1.5k stars today", tags: [] },
  { rank: 4, title: "rust-lang / rust", url: "https://github.com/rust-lang/rust", heat: "1.2k stars today", tags: [] },
  { rank: 5, title: "ollama / ollama", url: "https://github.com/ollama/ollama", heat: "1.1k stars today", tags: [] },
  { rank: 6, title: "langchain-ai / langchain", url: "https://github.com/langchain-ai/langchain", heat: "980 stars today", tags: [] },
  { rank: 7, title: "microsoft / vscode", url: "https://github.com/microsoft/vscode", heat: "870 stars today", tags: [] },
  { rank: 8, title: "tauri-apps / tauri", url: "https://github.com/tauri-apps/tauri", heat: "760 stars today", tags: [] },
  { rank: 9, title: "denoland / deno", url: "https://github.com/denoland/deno", heat: "690 stars today", tags: [] },
  { rank: 10, title: "vercel / next.js", url: "https://github.com/vercel/next.js", heat: "640 stars today", tags: [] },
  { rank: 11, title: "tailwindlabs / tailwindcss", url: "https://github.com/tailwindlabs/tailwindcss", heat: "590 stars today", tags: [] },
];

export const mockSources: HotPlatform[] = [
  {
    source: "weibo",
    name: "微博",
    listName: "热搜榜",
    status: "ok",
    updatedAt: "2026-06-06T10:29:45Z",
    items: weiboItems,
  },
  {
    source: "zhihu",
    name: "知乎",
    listName: "热榜",
    status: "ok",
    updatedAt: "2026-06-06T10:29:50Z",
    items: zhihuItems,
  },
  {
    source: "bilibili",
    name: "哔哩哔哩",
    listName: "热门榜",
    status: "ok",
    updatedAt: "2026-06-06T10:29:48Z",
    items: bilibiliItems,
  },
  {
    source: "github",
    name: "GitHub",
    listName: "Trending",
    status: "ok",
    updatedAt: "2026-06-06T10:29:30Z",
    items: githubItems,
  },
];

// ---------- 综合热榜：与后端一致的简单可解释算法 ----------
// score = max(0, 50 - rank) + (出现平台数 - 1) * 15 + sourceWeight
// 去重：标题完全相同视为同一事件（这里 mock 数据标题各异，主要演示算法与展示）。

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

function normalizeTitle(title: string): string {
  return title.replace(/[\s\p{P}]/gu, "").toLowerCase();
}

function buildRanking(sources: HotPlatform[]): RankingItem[] {
  type Agg = {
    title: string;
    url: string;
    heat?: string;
    platforms: Set<Source>;
    bestRank: number;
    rankScoreSum: number;
  };
  const map = new Map<string, Agg>();

  for (const platform of sources) {
    if (platform.status !== "ok") continue;
    for (const item of platform.items) {
      const key = normalizeTitle(item.title);
      const rankScore = Math.max(0, 50 - item.rank);
      const existing = map.get(key);
      if (existing) {
        existing.platforms.add(platform.source);
        existing.rankScoreSum += rankScore;
        if (item.rank < existing.bestRank) {
          existing.bestRank = item.rank;
          existing.url = item.url;
          existing.heat = item.heat;
        }
      } else {
        map.set(key, {
          title: item.title,
          url: item.url,
          heat: item.heat,
          platforms: new Set([platform.source]),
          bestRank: item.rank,
          rankScoreSum: rankScore,
        });
      }
    }
  }

  const scored = Array.from(map.values()).map((agg) => {
    const platforms = Array.from(agg.platforms);
    const platformBonus = (platforms.length - 1) * 15;
    const sourceWeight = Math.max(...platforms.map((s) => SOURCE_WEIGHT[s]));
    const baseRankScore = Math.max(0, 50 - agg.bestRank);
    const score = baseRankScore + platformBonus + sourceWeight;
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

export const mockRanking: RankingItem[] = buildRanking(mockSources);

// ---------- 顶层 mock 响应（AI 第一阶段不可用）----------

export const mockHotResponse: HotResponse = {
  updatedAt: "2026-06-06T10:30:00Z",
  ai: {
    available: false,
    status: "unavailable",
    featured: [],
    recommendations: [],
  },
  ranking: mockRanking,
  sources: mockSources,
};
