import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 开发代理：/api 转发到后端 Express（默认 3001），见 AGENTS.md「开发代理」
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
