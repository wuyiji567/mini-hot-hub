// AI 编排：状态机 + 缓存 + 熔断 + 分类默认图。
// buildAi 永不抛错——任何失败都降级为 unavailable，保证 ranking / sources 照常返回。

import type { HotPlatform, HotResponse, AIFeatured, AIRecommend, Source } from "../types/index.js";
import { getCache, setCache, DEFAULT_TTL } from "../utils/cache.js";
import { isAiEnabled, callDeepseek } from "./deepseek.js";
import {
  buildFeaturedPrompt,
  buildRecommendPrompt,
  buildTagPrompt,
  type SlimItem,
} from "./prompts.js";
import { parseJson, parseFeatured, parseRecommend, parseTagResults } from "./parser.js";

const AI_RESULT_KEY = "ai:result";
const AI_FAIL_KEY = "ai:fail";
const FAIL_TTL = 120; // 失败熔断 120 秒，避免疯狂重试

/** 默认兴趣标签（MVP 预设，无登录画像） */
const DEFAULT_INTERESTS = ["科技", "财经", "社会"];

/** 分类默认图映射（imageUrl 用 /images/category/*.jpg；AI 不编造图片 URL） */
const CATEGORY_IMAGES: Record<string, string> = {
  科技: "/images/category/tech.jpg",
  娱乐: "/images/category/entertainment.jpg",
  体育: "/images/category/sports.jpg",
  财经: "/images/category/finance.jpg",
  社会: "/images/category/society.jpg",
  游戏: "/images/category/gaming.jpg",
  教育: "/images/category/education.jpg",
  汽车: "/images/category/auto.jpg",
  国际: "/images/category/world.jpg",
  生活: "/images/category/life.jpg",
  其他: "/images/category/default.jpg",
};

/** 由标签文案（如「科技 · AI」）取分类默认图，找不到用 default */
export function imageForCategory(tag: string | undefined): string {
  const main = (tag ?? "").split("·")[0]?.trim();
  return CATEGORY_IMAGES[main ?? ""] ?? CATEGORY_IMAGES["其他"];
}

// 缓存载荷：除 AI 卡片外，也缓存「标题→标签」映射，便于 hot:all 重建时回填 items.tags。
type AiPayload = {
  featured: AIFeatured[];
  recommendations: AIRecommend[];
  tagPairs: [string, string[]][];
};

function unavailable(): HotResponse["ai"] {
  return { available: false, status: "unavailable", featured: [], recommendations: [] };
}

/** 标题归一化（去空格标点小写），用于标签按标题回填，跨重建稳定 */
function normalizeTitle(title: string): string {
  return title.replace(/[\s\p{P}]/gu, "").toLowerCase();
}

/** 从各平台数据提取喂给 AI 的精简条目（平台/排名/标题）；perPlatform 控制每平台取几条 */
function toSlimItems(sources: HotPlatform[], perPlatform: number): SlimItem[] {
  const out: SlimItem[] = [];
  for (const p of sources) {
    if (p.status !== "ok") continue;
    for (const it of p.items.slice(0, perPlatform)) {
      out.push({ platform: p.source, rank: it.rank, title: it.title });
    }
  }
  return out;
}

/**
 * 兜底：AI 未给 platforms 时，按 eventTitle 与 slim 条目做标题匹配，
 * 取共有 4 字以上连续片段的条目作为来源平台（去重、最多 3 个）。
 */
function derivePlatforms(
  eventTitle: string,
  slim: SlimItem[],
): { source: Source; rank: number }[] {
  const ev = normalizeTitle(eventTitle);
  if (ev.length < 4) return [];
  const seen = new Set<string>();
  const out: { source: Source; rank: number }[] = [];
  for (const it of slim) {
    const t = normalizeTitle(it.title);
    if (t.length < 4 || seen.has(it.platform)) continue;
    let hit = false;
    for (let i = 0; i + 4 <= t.length; i++) {
      if (ev.includes(t.slice(i, i + 4))) {
        hit = true;
        break;
      }
    }
    if (hit) {
      seen.add(it.platform);
      out.push({ source: it.platform as Source, rank: it.rank });
      if (out.length >= 3) break;
    }
  }
  return out;
}

/** C1：把「标题→标签」映射回填到各平台 items.tags（非法已在 parser 过滤） */
function applyTags(sources: HotPlatform[], tagMap: Map<string, string[]>): void {
  for (const p of sources) {
    if (p.status !== "ok") continue;
    for (const it of p.items) {
      const tags = tagMap.get(normalizeTitle(it.title));
      if (tags && tags.length > 0) it.tags = tags;
    }
  }
}

/** 给 AI 卡片按分类填充默认图 */
function withImages<T extends AIFeatured | AIRecommend>(items: T[]): T[] {
  return items.map((it) => ({
    ...it,
    imageUrl: imageForCategory("tag" in it ? it.tag : it.tags?.[0]),
  }));
}

/**
 * 构建 AI 区域（状态机）：
 * - AI 未开启 → unavailable
 * - 近期失败熔断中 → unavailable
 * - 命中 ai:result 缓存 → ready
 * - 否则调用 DeepSeek 生成 → 成功 ready 并缓存；失败 unavailable 并熔断
 * 永不抛错。
 */
export async function buildAi(sources: HotPlatform[]): Promise<HotResponse["ai"]> {
  if (!isAiEnabled()) return unavailable();

  if (getCache<boolean>(AI_FAIL_KEY)) return unavailable();

  // 命中缓存：直接 ready，并把缓存的标签回填到本次 sources（hot:all 重建场景）
  const cached = getCache<AiPayload>(AI_RESULT_KEY);
  if (cached) {
    applyTags(sources, new Map(cached.tagPairs));
    return { available: true, status: "ready", featured: cached.featured, recommendations: cached.recommendations };
  }

  try {
    // 标签覆盖更广（每平台 20 条，对齐平台页展示与后续标签筛选）；
    // 归纳/推荐用更小输入（每平台 5 条）控制耗时。
    const slimForTags = toSlimItems(sources, 20);
    const slimForGen = toSlimItems(sources, 5);
    if (slimForTags.length === 0) return unavailable();

    // C1/C2/C3 三个 prompt 互相独立，并行调用以缩短首次生成耗时（任一失败则整体降级）
    const [tagText, featuredText, recText] = await Promise.all([
      callDeepseek(buildTagPrompt(slimForTags)),
      callDeepseek(buildFeaturedPrompt(slimForGen)),
      callDeepseek(buildRecommendPrompt(slimForGen, DEFAULT_INTERESTS)),
    ]);

    // C1：分类标签 → 回填 items.tags（覆盖每平台前 20 条）
    const indexTags = parseTagResults(parseJson(tagText)); // Map<index, tags>
    const tagMap = new Map<string, string[]>();
    for (const [idx, tags] of indexTags) {
      const item = slimForTags[idx];
      if (item) tagMap.set(normalizeTitle(item.title), tags);
    }
    applyTags(sources, tagMap);

    // C2：今日最热 + 热点速览；platforms 为空时按标题匹配兜底（用更广的 slimForTags）
    const featured = withImages(parseFeatured(parseJson(featuredText))).map((f) => ({
      ...f,
      platforms: f.platforms.length > 0 ? f.platforms : derivePlatforms(f.eventTitle, slimForTags),
    }));

    // C3：个性推荐
    const recommendations = withImages(parseRecommend(parseJson(recText)));

    const payload: AiPayload = {
      featured,
      recommendations,
      tagPairs: Array.from(tagMap.entries()),
    };
    setCache(AI_RESULT_KEY, payload, DEFAULT_TTL);
    return { available: true, status: "ready", featured, recommendations };
  } catch (err) {
    // 失败熔断 + 降级，绝不影响基础热榜
    console.error("[ai] 生成失败，降级 unavailable:", err instanceof Error ? err.message : err);
    setCache(AI_FAIL_KEY, true, FAIL_TTL);
    return unavailable();
  }
}
