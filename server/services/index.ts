// 平台 service 统一导出 + 并发调度。
// 单平台失败被隔离为 status: "error"，不拖垮整体响应（PRD F6 / AGENTS 降级规则）。

import type { HotItem, HotPlatform, Source } from "../types/index.js";
import { fetchWeibo } from "./weibo.js";
import { fetchZhihu } from "./zhihu.js";
import { fetchBilibili } from "./bilibili.js";
import { fetchGithub } from "./github.js";

interface ServiceMeta {
  source: Source;
  name: string;
  listName: string;
  fetch: () => Promise<HotItem[]>;
}

/** 第一阶段已接入的平台注册表 */
export const SERVICES: Record<string, ServiceMeta> = {
  weibo: { source: "weibo", name: "微博", listName: "热搜榜", fetch: fetchWeibo },
  zhihu: { source: "zhihu", name: "知乎", listName: "热榜", fetch: fetchZhihu },
  bilibili: { source: "bilibili", name: "哔哩哔哩", listName: "热门榜", fetch: fetchBilibili },
  github: { source: "github", name: "GitHub", listName: "Trending", fetch: fetchGithub },
};

/** 抓取单个平台，失败时返回 error 态而非抛出 */
/**
 * 开发/测试用失败模拟开关：设置环境变量 MOCK_FAIL_<SOURCE>=1 可让该平台强制失败，
 * 用于验证单平台降级。例如 MOCK_FAIL_WEIBO=1、MOCK_FAIL_GITHUB=1。
 * 生产环境不设置这些变量即无任何影响（不含硬编码 throw）。
 */
function shouldMockFail(source: Source): boolean {
  return process.env[`MOCK_FAIL_${source.toUpperCase()}`] === "1";
}

export async function fetchPlatform(meta: ServiceMeta): Promise<HotPlatform> {
  try {
    if (shouldMockFail(meta.source)) {
      throw new Error(`[模拟失败] MOCK_FAIL_${meta.source.toUpperCase()} 已开启`);
    }
    const items = await meta.fetch();
    return {
      source: meta.source,
      name: meta.name,
      listName: meta.listName,
      status: "ok",
      updatedAt: new Date().toISOString(),
      items,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "数据源暂时不可用";
    return {
      source: meta.source,
      name: meta.name,
      listName: meta.listName,
      status: "error",
      updatedAt: null,
      items: [],
      errorMessage: message,
    };
  }
}

/** 并发抓取全部已接入平台；任一失败被隔离 */
export async function fetchAllPlatforms(): Promise<HotPlatform[]> {
  const metas = Object.values(SERVICES);
  return Promise.all(metas.map((meta) => fetchPlatform(meta)));
}

/** 抓取指定单平台；未注册返回 null（路由据此 404） */
export async function fetchSinglePlatform(source: string): Promise<HotPlatform | null> {
  const meta = SERVICES[source];
  if (!meta) return null;
  return fetchPlatform(meta);
}
