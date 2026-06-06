// 核心类型定义 —— 严格遵循 AGENTS.md / TECH_DESIGN.md，前后端共享契约
// 第一阶段 services 只实现 weibo / zhihu / bilibili / github，但类型保留完整枚举。

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

/** 单条热搜 */
export interface HotItem {
  rank: number; // 平台内排名
  title: string;
  heat?: string; // 原始热度文本，如 "534万"；只展示，不用于跨平台排序
  url: string;
  tags: string[]; // 分类标签；AI 不可用时为空数组
}

/** 单平台数据 */
export interface HotPlatform {
  source: Source;
  name: string; // 平台中文名，如 "微博"
  listName: string; // 榜单名，如 "热搜榜"
  status: "ok" | "error";
  updatedAt: string | null; // ISO8601；失败时为 null
  items: HotItem[];
  errorMessage?: string;
}

/** 综合热榜条目 */
export interface RankingItem {
  rank: number; // 全局排名 1~20，序号连续不重复
  title: string;
  url: string;
  heat: string; // 展示用综合热度
  platforms: Source[]; // 出现在哪些平台
  score: number; // 后端计算的排序分数，前端可不展示
  trend: "up" | "down" | "flat";
}

/** AI 增强卡片（今日最热 / 热点速览）—— 第一阶段不生成，仅保留类型 */
export interface AIFeatured {
  eventTitle: string;
  hotReason: string;
  tag: string;
  imageUrl: string; // 使用分类默认图，AI 不直接生成图片 URL
  platforms: {
    source: Source;
    rank: number;
  }[];
  heat: string;
  trend: string;
  section: "featured" | "quick";
}

/** AI 推荐卡片 —— 第一阶段不生成，仅保留类型 */
export interface AIRecommend {
  eventTitle: string;
  reasonType: "follow" | "similar";
  reasonLabel: string;
  aiReason: string;
  imageUrl: string; // 使用分类默认图
  platform: Source;
  platformCount: number;
  heat: string;
  tags: string[];
}

/** 顶层响应 */
export interface HotResponse {
  updatedAt: string;
  stale?: boolean; // 返回过期缓存时为 true
  message?: string; // 如 "数据可能已过期"
  ai: {
    available: boolean;
    status: "ready" | "pending" | "unavailable";
    featured: AIFeatured[];
    recommendations: AIRecommend[];
  };
  ranking: RankingItem[]; // 顶层，不在 ai 内部，不依赖 AI
  sources: HotPlatform[];
}
