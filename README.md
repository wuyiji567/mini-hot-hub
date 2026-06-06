# 今日热搜 · Mini Hot Hub

一个 AI 增强的多平台热搜聚合网站。聚合微博、知乎、B站、GitHub 等平台的实时热榜，并提供综合热榜排名，帮助用户一处看完全网热点。

> **当前进度：MVP 第一阶段** —— 前后端框架已跑通，后端提供 **Mock API**（暂不接真实上游），前端通过 `/api/hot` 获取数据。AI 能力、抖音及其余平台为后续阶段。

## 技术栈

- **前端**：React + TypeScript + Vite + CSS Modules（深色科技风）
- **后端**：Node.js + Express + TypeScript（内存缓存）
- **数据**：第一阶段为本地 Mock，4 个平台（weibo / zhihu / bilibili / github）

## 项目结构

```
mini-hot-hub/
├── client/        # 前端（Vite + React），开发端口 5173
├── server/        # 后端（Express），开发端口 3001
├── PRD.md / TECH_DESIGN.md / AGENTS.md   # 需求与设计文档
└── docs/          # 过程文档归档
```

## 快速开始

需要本地已安装 Node.js（建议 v18+）。

### 1. 安装依赖

前后端各自独立安装：

```bash
# 安装后端依赖
cd server && npm install

# 安装前端依赖
cd client && npm install
```

### 2. 同时启动前后端

需要**两个终端**，并且**先启动后端**（前端依赖后端的 `/api`）。

```bash
# 终端 1：启动后端（http://localhost:3001）
cd server && npm run dev

# 终端 2：启动前端（http://localhost:5173）
cd client && npm run dev
```

启动后访问：

- 前端页面：<http://localhost:5173>
- 后端接口：<http://localhost:3001/api/hot>

> Vite 已将 `/api` 代理到 `http://localhost:3001`，所以前端用相对路径 `/api/hot` 即可访问后端，无需关心跨域。

## 接口一览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查，返回 `{ "ok": true }` |
| GET | `/api/hot` | 全量数据：`updatedAt` + `ai` + `ranking` + `sources` |
| GET | `/api/hot/weibo` | 单平台：微博 |
| GET | `/api/hot/zhihu` | 单平台：知乎 |
| GET | `/api/hot/bilibili` | 单平台：B站 |
| GET | `/api/hot/github` | 单平台：GitHub |
| GET | `/api/hot/<无效source>` | 返回 404 |

`/api/hot` 走 `hot:all` 内存缓存（默认 TTL 300 秒）；开发环境加 `?refresh=1` 可跳过缓存。

## 构建

```bash
cd server && npm run build   # 编译到 server/dist
cd client && npm run build   # 编译到 client/dist
```

## 常见问题（FAQ）

### a. 3001 端口被占用怎么办？

后端默认监听 3001。若端口被占用，有两种处理：

```bash
# 方案一：换端口启动（PORT 环境变量覆盖）
cd server && PORT=3002 npm run dev
# 注意：换端口后需同步修改 client/vite.config.ts 里的代理 target，否则前端仍打 3001

# 方案二：找出并结束占用 3001 的进程
lsof -nP -iTCP:3001 -sTCP:LISTEN     # 查看占用进程 PID
kill <PID>                            # 结束该进程
# 若占用的是本项目残留的旧进程，可直接：
pkill -f "mini-hot-hub/server"
```

### b. 5173 端口被占用怎么办？

Vite 默认用 5173。若被占用，Vite 通常会**自动改用 5174 等下一个可用端口**，并在终端打印实际地址，按打印的地址访问即可。也可手动指定：

```bash
cd client && npm run dev -- --port 5180
# 或修改 client/vite.config.ts 中 server.port
```

### c. 前端页面请求失败怎么办？

页面进入错误态（“数据加载失败”+ 重试按钮）通常是后端没起来或挂了：

1. 确认**后端正在运行**：浏览器直接打开 <http://localhost:3001/api/health>，应返回 `{"ok":true}`。
2. 确认启动顺序：**先后端、再前端**；若先开前端，刷新页面或点重试即可。
3. 看前端是否走的是真实接口：`client/src/api/fetchHot.ts` 里 `USE_MOCK` 应为 `false`。
4. 打开浏览器 DevTools → Network → Fetch/XHR，看 `/api/hot` 请求的状态码和响应。

### d. /api 代理不生效怎么办？

表现为前端请求 `/api/hot` 返回 404 或 HTML 而不是 JSON：

1. 确认 `client/vite.config.ts` 中存在代理配置，`target` 指向后端实际端口：
   ```ts
   server: { proxy: { "/api": { target: "http://localhost:3001", changeOrigin: true } } }
   ```
2. **改过 `vite.config.ts` 后必须重启 `npm run dev`**，代理配置不会热更新。
3. 若后端改了端口（如 3002），代理 `target` 要同步改成相同端口。
4. 确认后端确实在跑：`curl http://localhost:3001/api/hot` 能返回 JSON。

## 如何确认前端数据来自后端

两条独立证据：

1. **后端日志**：后端终端会打印每条请求，如 `… GET /api/hot`。前端一加载就出现这行，说明请求打到了后端。
2. **响应头**：DevTools → Network → 选中 `hot` 请求 → 响应标头里有 `X-Powered-By: Express`，证明响应来自 Express 后端而非前端本地 mock。

## 说明与合规

本站为个人学习项目，非商用。数据来源于各平台公开信息，非官方，仅供学习交流。详见 [PRD.md](PRD.md)、[TECH_DESIGN.md](TECH_DESIGN.md)、[AGENTS.md](AGENTS.md)。
