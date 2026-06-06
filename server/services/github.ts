// GitHub service —— 第一阶段返回 mock。

import type { HotItem } from "../types/index.js";

const MOCK_ITEMS: HotItem[] = [
  { rank: 1, title: "open-llm / awesome-models", url: "https://github.com/open-llm/awesome-models", heat: "3.2k stars today", tags: [] },
  { rank: 2, title: "vitejs / vite", url: "https://github.com/vitejs/vite", heat: "1.8k stars today", tags: [] },
  { rank: 3, title: "facebook / react", url: "https://github.com/facebook/react", heat: "1.5k stars today", tags: [] },
  { rank: 4, title: "rust-lang / rust", url: "https://github.com/rust-lang/rust", heat: "1.2k stars today", tags: [] },
  { rank: 5, title: "ollama / ollama", url: "https://github.com/ollama/ollama", heat: "1.1k stars today", tags: [] },
  { rank: 6, title: "langchain-ai / langchain", url: "https://github.com/langchain-ai/langchain", heat: "980 stars today", tags: [] },
  { rank: 7, title: "microsoft / vscode", url: "https://github.com/microsoft/vscode", heat: "870 stars today", tags: [] },
  { rank: 8, title: "tauri-apps / tauri", url: "https://github.com/tauri-apps/tauri", heat: "760 stars today", tags: [] },
  { rank: 9, title: "denoland / deno", url: "https://github.com/denoland/deno", heat: "690 stars today", tags: [] },
  { rank: 10, title: "vercel / next.js", url: "https://github.com/vercel/next.js", heat: "640 stars today", tags: [] },
  { rank: 11, title: "tailwindlabs / tailwindcss", url: "https://github.com/tailwindlabs/tailwindcss", heat: "590 stars today", tags: [] },
];

export async function fetchGithub(): Promise<HotItem[]> {
  return MOCK_ITEMS;
}
