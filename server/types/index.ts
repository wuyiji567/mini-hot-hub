// 后端核心类型 —— 与 client/src/types/index.ts 保持一致（AGENTS.md 契约）。
// 第一阶段 services 只实现 weibo / zhihu / bilibili / github，类型保留完整枚举。

export type Source =
  | "weibo"
  | "zhihu"
  | "bilibili"
  | "github"
  | "thepaper"
  | "kr36"
  | "hupu"
  | "toutiao"
  | "douyin";

export interface HotItem {
  rank: number;
  title: string;
  heat?: string;
  url: string;
  tags: string[];
}

export interface HotPlatform {
  source: Source;
  name: string;
  listName: string;
  status: "ok" | "error";
  updatedAt: string | null;
  items: HotItem[];
  errorMessage?: string;
}

export interface RankingItem {
  rank: number;
  title: string;
  url: string;
  heat: string;
  platforms: Source[];
  score: number;
  trend: "up" | "down" | "flat";
}

export interface AIFeatured {
  eventTitle: string;
  hotReason: string;
  tag: string;
  imageUrl: string;
  platforms: { source: Source; rank: number }[];
  heat: string;
  trend: string;
  section: "featured" | "quick";
}

export interface AIRecommend {
  eventTitle: string;
  reasonType: "follow" | "similar";
  reasonLabel: string;
  aiReason: string;
  imageUrl: string;
  platform: Source;
  platformCount: number;
  heat: string;
  tags: string[];
}

export interface HotResponse {
  updatedAt: string;
  stale?: boolean;
  message?: string;
  ai: {
    available: boolean;
    status: "ready" | "pending" | "unavailable";
    featured: AIFeatured[];
    recommendations: AIRecommend[];
  };
  ranking: RankingItem[];
  sources: HotPlatform[];
}

/** 第一阶段实际聚合的平台 */
export const ACTIVE_SOURCES: Source[] = ["weibo", "zhihu", "bilibili", "github"];

/** 全部合法 source（用于 /api/hot/:source 校验） */
export const VALID_SOURCES: Source[] = [
  "weibo",
  "zhihu",
  "bilibili",
  "github",
  "thepaper",
  "kr36",
  "hupu",
  "toutiao",
  "douyin",
];
