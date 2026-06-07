# 今日热搜 · Mini Hot Hub

一个 AI 增强的多平台热搜聚合网站。聚合微博、知乎、B站、GitHub 等平台的实时热榜，并提供综合热榜排名，帮助用户一处看完全网热点。

🔗 **在线体验**：<https://mini-hot-hub-five.vercel.app>

> 前端部署于 Vercel，后端部署于 Railway（`https://mini-hot-hub-production-66e2.up.railway.app`）。

> **当前进度：MVP 第一阶段** —— 前后端框架已跑通，4 个平台均已接入**真实公开 JSON 接口**，前端通过 `/api/hot` 获取数据。AI 能力、抖音及其余平台为后续阶段。

## 技术栈

- **前端**：React + TypeScript + Vite + CSS Modules（深色科技风）
- **后端**：Node.js + Express + TypeScript（内存缓存）
- **数据**：4 个平台（weibo / zhihu / bilibili / github）均来自各平台公开 JSON 接口

## 数据来源

当前数据全部来自各平台的**公开 JSON 接口**，后端在服务端请求并统一解析为 `HotItem[]`，前端不直接请求任何上游：

| 平台 | 接口 | 取数 |
|------|------|------|
| 微博 | `https://weibo.com/ajax/side/hotSearch` | `data.realtime`：词条、热度 |
| 知乎 | `https://api.zhihu.com/topstory/hot-lists/total` | `data`：问题标题、热度、问题 id |
| B站 | `https://api.bilibili.com/x/web-interface/popular` | `data.list`：标题、播放量、bvid |
| GitHub | `https://api.github.com/search/repositories`（近 7 天按 star 排序） | `items`：full_name、star/fork、html_url |

- 不解析 HTML 页面，不使用任何 cookie / token / 密钥；GitHub 走未认证 Search API（受 IP 限流）。
- **缓存**：完整 `/api/hot` 响应缓存在内存 `hot:all`，**TTL 默认 300 秒**（可用 `CACHE_TTL` 环境变量覆盖），避免高频请求上游；开发时加 `?refresh=1` 可跳过缓存。
- **降级**：任一平台请求失败/格式变化/数据为空时，该平台返回 `status:"error"` 并附清晰 `errorMessage`，其他平台不受影响。
- 本站为**个人学习项目，非商用**，数据来源于各平台**公开信息，非官方**，仅供学习交流。

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

## 部署（Deploy）

本项目是 **monorepo**：`client/`（前端）与 `server/`（后端）是两个独立子目录，**分别部署**。前端推荐 Vercel（静态托管），后端推荐 Railway / Render（Node 服务）。在托管平台新建项目时，关键是把 **Root Directory 指到对应子目录**。

### 前端（client/，例：Vercel）

| 配置项 | 值 |
|--------|-----|
| Root Directory | `client` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| 环境变量 | `VITE_API_BASE` = 后端公网地址（如 `https://your-backend.up.railway.app`） |

> `VITE_API_BASE` 是**构建期**变量，修改后需重新部署前端才能生效。本地不设置时前端走相对路径 `/api` + Vite 代理。

### 后端（server/，例：Railway / Render）

| 配置项 | 值 |
|--------|-----|
| Root Directory | `server` |
| Build Command | `npm run build` |
| Start Command | `npm start` |
| 环境变量 | `PORT`（平台通常自动注入）、`CACHE_TTL=300`、`CLIENT_ORIGIN`=前端公网域名 |

> 部署顺序建议：**先部署后端**拿到公网地址 → 填入前端 `VITE_API_BASE` 部署前端 → 用前端域名回填后端 `CLIENT_ORIGIN` 重新部署后端（CORS 才放行）。

## 环境变量清单

| 变量 | 作用 | 本地默认 | 生产填法 |
|------|------|----------|----------|
| `PORT` | 后端监听端口 | `3001` | 一般留空，由托管平台自动注入；后端已支持读取 |
| `CACHE_TTL` | `hot:all` 缓存秒数 | `300` | 保持 `300`，避免高频请求上游 |
| `CLIENT_ORIGIN` | 后端 CORS 允许的前端来源 | `http://localhost:5173` | **必须**改为前端真实域名，如 `https://your-app.vercel.app` |
| `VITE_API_BASE` | 前端请求后端的基础地址（构建期注入） | 不设（走 `/api` 代理） | 后端公网地址，如 `https://your-backend.up.railway.app` |

## 部署前检查表

- [ ] `cd client && npm run build` 构建成功，生成 `client/dist`
- [ ] `cd server && npm run build` 构建成功，生成 `server/dist`
- [ ] `cd server && npm start` 能以生产方式启动
- [ ] 前端 `VITE_API_BASE` 已设为后端公网地址
- [ ] 后端 `CLIENT_ORIGIN` 已设为前端公网域名
- [ ] 后端 `CACHE_TTL` 保持 `300`，`PORT` 交由平台注入
- [ ] 未提交 `.env` / token / cookie / `node_modules` / `dist`（已在 `.gitignore` 排除）
- [ ] 后端部署环境能访问外网：微博、知乎、B站、GitHub 公开接口
- [ ] 知悉 GitHub 未认证 API 可能限流（403/429 时该平台降级，不影响其他平台）
- [ ] 部署后 `<后端域名>/api/hot` 能返回 JSON
- [ ] 部署后前端页面能正常展示综合热榜与平台数据
- [ ] 上线前确认页脚侵权联系渠道可用（当前为「通过项目仓库 Issue 联系」）

## 开发测试：模拟单平台失败

后端支持环境变量 `MOCK_FAIL_<SOURCE>=1`，用于在**开发/测试**时强制某个平台失败，验证单平台降级体验。`<SOURCE>` 取大写平台名：`WEIBO` / `ZHIHU` / `BILIBILI` / `GITHUB`。

```bash
# 模拟微博失败（其余平台正常）
cd server && MOCK_FAIL_WEIBO=1 npm run dev

# 也可同时模拟多个
MOCK_FAIL_WEIBO=1 MOCK_FAIL_GITHUB=1 npm run dev
```

启用后访问 <http://localhost:3001/api/hot?refresh=1>：

- 被模拟的平台 `status: "error"`、`items: []`、带清晰 `errorMessage`；
- 其他平台仍 `status: "ok"`；整体仍返回完整 `HotResponse`，`ranking` 正常。
- 前端「平台」页中该平台显示错误卡片 + **重试**按钮。

**恢复正常**：停止后端（`Ctrl+C`），用**不带** `MOCK_FAIL_*` 的命令重启（`npm run dev`），再点页面上的「重试」或刷新即可恢复。该开关仅靠环境变量生效，生产不设置即无任何影响，代码中无硬编码 `throw`。

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
