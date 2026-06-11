// AI 编排：状态机 + 缓存 + 熔断 + 分类默认图。
// buildAi 永不抛错——任何失败都降级为 unavailable，保证 ranking / sources 照常返回。

import type { HotPlatform, HotResponse, AIFeatured, AIRecommend } from "../types/index.js";
import { getCache, setCache, DEFAULT_TTL } from "../utils/cache.js";
import { isAiEnabled, callDeepseek } from "./deepseek.js";
import { buildFeaturedPrompt, buildRecommendPrompt, type SlimItem } from "./prompts.js";
import { parseJson, parseFeatured, parseRecommend } from "./parser.js";

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

type AiPayload = { featured: AIFeatured[]; recommendations: AIRecommend[] };

function unavailable(): HotResponse["ai"] {
  return { available: false, status: "unavailable", featured: [], recommendations: [] };
}

/** 从各平台数据提取喂给 AI 的精简条目（平台/排名/标题） */
function toSlimItems(sources: HotPlatform[]): SlimItem[] {
  const out: SlimItem[] = [];
  for (const p of sources) {
    if (p.status !== "ok") continue;
    for (const it of p.items.slice(0, 10)) {
      out.push({ platform: p.source, rank: it.rank, title: it.title });
    }
  }
  return out;
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

  const cached = getCache<AiPayload>(AI_RESULT_KEY);
  if (cached) {
    return { available: true, status: "ready", ...cached };
  }

  try {
    const slim = toSlimItems(sources);
    if (slim.length === 0) return unavailable();

    const featuredText = await callDeepseek(buildFeaturedPrompt(slim));
    const featured = withImages(parseFeatured(parseJson(featuredText)));

    const recText = await callDeepseek(buildRecommendPrompt(slim, DEFAULT_INTERESTS));
    const recommendations = withImages(parseRecommend(parseJson(recText)));

    const payload: AiPayload = { featured, recommendations };
    setCache(AI_RESULT_KEY, payload, DEFAULT_TTL);
    return { available: true, status: "ready", ...payload };
  } catch (err) {
    // 失败熔断 + 降级，绝不影响基础热榜
    console.error("[ai] 生成失败，降级 unavailable:", err instanceof Error ? err.message : err);
    setCache(AI_FAIL_KEY, true, FAIL_TTL);
    return unavailable();
  }
}
