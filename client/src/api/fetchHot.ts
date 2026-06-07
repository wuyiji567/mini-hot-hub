// API 请求封装。
// 第一阶段后端尚未就绪，默认返回本地 mock；后端上线后把 USE_MOCK 置为 false 即走 /api/hot。

import type { HotResponse } from "../types";
import { mockHotResponse } from "../mock/hotData";

// 已接入后端：走 /api/hot。如需脱离后端单独调试前端，临时改回 true 使用本地 mock。
const USE_MOCK = false;

// 后端 API 基础地址：
// - 本地开发：不设置 VITE_API_BASE，使用空串 → 相对路径 /api/hot，由 Vite proxy 转发到后端。
// - 生产部署：前后端通常不同域，设置 VITE_API_BASE 为后端公网地址（如 https://api.example.com），
//   前端请求 https://api.example.com/api/hot。末尾斜杠会被去除，避免出现双斜杠。
const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

/** 拉取全量热搜数据 */
export async function fetchHot(options?: { refresh?: boolean }): Promise<HotResponse> {
  if (USE_MOCK) {
    // 模拟网络延迟，方便观察 loading 态
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockHotResponse;
  }

  const query = options?.refresh ? "?refresh=1" : "";
  const res = await fetch(`${API_BASE}/api/hot${query}`);
  if (!res.ok) {
    throw new Error(`请求失败：${res.status}`);
  }
  return (await res.json()) as HotResponse;
}
