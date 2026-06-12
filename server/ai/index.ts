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
import { fetchOgImage } from "../utils/ogImage.js";

const AI_RESULT_KEY = "ai:result";
const AI_FAIL_KEY = "ai:fail";
const FAIL_TTL = 120; // 失败熔断 120 秒，避免疯狂重试

/** 默认兴趣标签（MVP 预设，无登录画像） */
const DEFAULT_INTERESTS = ["科技", "财经", "社会"];

/**
 * 分类 → 默认图文件名映射（未来挂钩）。
 * 当前这些 /images/category/*.jpg 文件尚未随产物部署，返回它们会让前端 <img> 404。
 * 因此 imageForCategory 目前一律返回 ""（空串）——前端图片管线对空 imageUrl 直接走渐变兜底，
 * 既不破图也不产生 404。待把分类占位图放进 client/public/images/category/ 后，
 * 再让本函数返回对应路径即可启用该兜底层。
 */
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
// 保留引用避免 TS 未使用告警；当前不返回这些路径（见上方说明）。
void CATEGORY_IMAGES;

/**
 * 由标签文案（如「科技 · AI」）取分类默认图。
 * 当前实现：恒返回 ""，让缺少真实 OG 图的卡片在前端走渐变兜底（不破图、不 404）。
 */
export function imageForCategory(_tag: string | undefined): string {
  return "";
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

/** 在 sources 中按 source + rank 找回原始 item.url（找不到返回 null） */
function urlBySourceRank(sources: HotPlatform[], source: Source, rank: number): string | null {
  const p = sources.find((s) => s.source === source && s.status === "ok");
  const item = p?.items.find((it) => it.rank === rank);
  return item?.url || null;
}

/** featured：用首个 platform 的 source+rank 回原始 url */
function urlForFeatured(f: AIFeatured, sources: HotPlatform[]): string | null {
  const first = f.platforms[0];
  return first ? urlBySourceRank(sources, first.source, first.rank) : null;
}

/** recommend：无 rank，按平台内标题归一化匹配回原始 url */
function urlForRecommend(r: AIRecommend, sources: HotPlatform[]): string | null {
  const p = sources.find((s) => s.source === r.platform && s.status === "ok");
  if (!p) return null;
  const ev = normalizeTitle(r.eventTitle);
  if (ev.length < 4) return null;
  const hit = p.items.find((it) => {
    const t = normalizeTitle(it.title);
    return t.length >= 4 && (t.includes(ev) || ev.includes(t));
  });
  return hit?.url || null;
}

/**
 * 用来源页 og:image 覆盖分类默认图（best-effort）：
 * - 找不到原始 url → 保留分类默认图
 * - og 抓取失败/无图 → 保留分类默认图
 * - 单条失败不影响其它条；整体兜底，绝不抛错（图片问题不得拖垮 AI）
 * items 进来时已带分类默认 imageUrl。
 */
async function enrichWithOgImages<T extends AIFeatured | AIRecommend>(
  items: T[],
  getUrl: (it: T) => string | null,
): Promise<T[]> {
  try {
    return await Promise.all(
      items.map(async (it) => {
        const pageUrl = getUrl(it);
        if (!pageUrl) return it;
        const og = await fetchOgImage(pageUrl); // 内部已兜底为 null
        return og ? { ...it, imageUrl: og } : it;
      }),
    );
  } catch (err) {
    console.error("[ai] og 图片富化失败，保留分类默认图:", err instanceof Error ? err.message : err);
    return items;
  }
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
    const featuredBase = withImages(parseFeatured(parseJson(featuredText))).map((f) => ({
      ...f,
      platforms: f.platforms.length > 0 ? f.platforms : derivePlatforms(f.eventTitle, slimForTags),
    }));

    // C3：个性推荐
    const recommendBase = withImages(parseRecommend(parseJson(recText)));

    // 图片来源：尽量用来源页 og:image 覆盖分类默认图（并行、best-effort、失败回落默认图）
    const [featured, recommendations] = await Promise.all([
      enrichWithOgImages(featuredBase, (f) => urlForFeatured(f, sources)),
      enrichWithOgImages(recommendBase, (r) => urlForRecommend(r, sources)),
    ]);

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
