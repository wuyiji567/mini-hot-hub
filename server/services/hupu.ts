// 虎扑 service —— 可降级平台。
//
// 现状：虎扑无稳定的公开 JSON 热榜接口（参考项目均靠解析 HTML 页面，
// 易随页面结构变化而失效）。按本项目「不解析 HTML、不接不稳定接口、不用 cookie/token」
// 的约束，第二阶段将虎扑作为「可降级平台」：直接抛出清晰错误，
// 由 services/index.ts 的 fetchPlatform 捕获后返回 status:"error"，
// 前端展示「数据源维护中」，不影响其他平台与综合热榜。
//
// 后续若找到稳定公开 JSON 数据源，再在此处替换为真实抓取（对外签名不变）。

import type { HotItem } from "../types/index.js";

export async function fetchHupu(): Promise<HotItem[]> {
  throw new Error("虎扑暂无稳定公开 JSON 数据源，当前作为可降级平台展示，数据源维护中");
}
