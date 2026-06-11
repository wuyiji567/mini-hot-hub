// Express 入口。
// 最先加载 server/.env（本地开发与 npm start 都生效）；放在最顶部，确保后续模块读 env 时已就绪。
import "dotenv/config";

import express from "express";
import cors from "cors";
import hotRouter from "./routes/hot.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// CORS：允许前端开发地址（可通过 CLIENT_ORIGIN 覆盖）
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// 简单请求日志：打印方法 + 路径，例如 "GET /api/hot"
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// 健康检查
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// 业务路由
app.use("/api", hotRouter);

// 404 兜底
app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`[mini-hot-hub] server listening on http://localhost:${PORT}`);
  console.log(`[mini-hot-hub] CORS origin: ${CLIENT_ORIGIN}`);
});
