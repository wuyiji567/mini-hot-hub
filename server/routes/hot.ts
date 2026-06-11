// /api/hot 路由：综合热榜 + 各平台数据 + AI 区域（第一阶段恒为 unavailable）。

import { Router } from "express";
import type { HotResponse } from "../types/index.js";
import { VALID_SOURCES } from "../types/index.js";
import { fetchAllPlatforms, fetchSinglePlatform } from "../services/index.js";
import { buildRanking } from "../ranking/buildRanking.js";
import { buildAi } from "../ai/index.js";
import { getCache, setCache, deleteCache } from "../utils/cache.js";

const router = Router();

const HOT_ALL_KEY = "hot:all";

/** 构建完整 /api/hot 响应（未命中缓存时） */
async function buildHotResponse(): Promise<HotResponse> {
  const sources = await fetchAllPlatforms();
  const ranking = buildRanking(sources);
  // AI 增强：buildAi 永不抛错，失败/未开启时返回 unavailable，不影响 ranking/sources
  const ai = await buildAi(sources);
  return {
    updatedAt: new Date().toISOString(),
    ai,
    ranking,
    sources,
  };
}

// GET /api/hot —— 全量数据，走 hot:all 缓存；?refresh=1 跳过缓存
router.get("/hot", async (req, res) => {
  const refresh = req.query.refresh === "1";

  if (!refresh) {
    const cached = getCache<HotResponse>(HOT_ALL_KEY);
    if (cached) {
      console.log(`[cache hit] ${HOT_ALL_KEY}`);
      res.json(cached);
      return;
    }
    console.log(`[cache miss] ${HOT_ALL_KEY}`);
  } else {
    console.log(`[cache refresh] ${HOT_ALL_KEY}`);
    deleteCache(HOT_ALL_KEY);
  }

  try {
    const response = await buildHotResponse();
    setCache(HOT_ALL_KEY, response);
    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    res.status(500).json({ error: "服务暂时不可用", message });
  }
});

// GET /api/hot/:source —— 单平台数据；无效 source 返回 404
router.get("/hot/:source", async (req, res) => {
  const { source } = req.params;

  // 不在合法枚举内：404
  if (!VALID_SOURCES.includes(source as never)) {
    res.status(404).json({ error: "未知平台", source });
    return;
  }

  const platform = await fetchSinglePlatform(source);

  // 合法枚举但第一阶段未接入（如 douyin）：404 提示未接入
  if (!platform) {
    res.status(404).json({ error: "该平台暂未接入", source });
    return;
  }

  res.json(platform);
});

export default router;
