# 部署检查清单（DEPLOY_CHECKLIST）

上线前逐项确认。前后端可分开部署（静态前端 + Node 后端），也可同域反代。

## 1. 必须配置的环境变量

### 前端（构建时注入，Vite）
- **`VITE_API_BASE=<后端公网地址>`**
  - 例：`VITE_API_BASE=https://api.example.com`
  - 前后端**不同域**时必须设置；否则前端请求相对路径 `/api/hot`，生产环境没有 Vite dev proxy，会 404 / 白屏。
  - 同域反代（前端与 `/api` 在同一域）可留空。
  - 末尾斜杠会被自动去除，避免双斜杠。

### 后端（运行时，`server/.env`）
- **`CLIENT_ORIGIN=<前端公网地址>`**
  - 例：`CLIENT_ORIGIN=https://hot.example.com`
  - 必须设为前端实际访问域名；否则 CORS 拦截，前端拿不到数据。默认值 `http://localhost:5173` 仅用于本地。
- `DEEPSEEK_API_KEY=<密钥>`：AI 功能所需。缺失时 AI 区域降级为 `unavailable`，热榜/平台仍正常。
- 可选：`AI_ENABLED`、`DEEPSEEK_MODEL`、`CACHE_TTL`、`PORT`（默认 3001）。

> **`server/.env` 严禁提交到仓库**（含密钥）。已由 git ignore 排除，部署时在服务器单独配置。

## 2. 构建命令

```bash
# 前端（产物在 client/dist，交给静态托管 / Nginx）
cd client && npm run build

# 后端（产物在 server/dist，node 运行）
cd server && npm run build
cd server && npm run start    # = node dist/index.js
```

## 3. `/api/hot` 上线后字段自检

请求 `GET <后端>/api/hot`，确认 JSON 含以下字段：

- `updatedAt`：ISO 时间字符串
- `ai.available` / `ai.status`（`ready` | `pending` | `unavailable`）
- `ai.featured`：数组（今日最热 + 热点速览）
- `ai.recommendations`：数组（个性推荐）
- `ranking`：数组（综合热榜 Top 20）
- `sources`：数组（各平台，含 `status: "ok" | "error"`）

健康检查：`GET <后端>/api/health` 返回 `{"ok":true}`。

## 4. 图片行为（OG Provider）

- AI 卡片的 `imageUrl` 优先使用来源页真实 `og:image` / `twitter:image`（后端 best-effort 抓取）。
- **抓取失败 / 无图 / 找不到来源 url 时，`imageUrl` 为空字符串 `""`**，前端自动用**分类渐变兜底**——不破图、不产生 404。
- 当前未部署分类占位图（`/images/category/*.jpg`）。若日后想启用"分类默认图"中间层：把占位图放进 `client/public/images/category/`，再让 `server/ai/index.ts` 的 `imageForCategory` 返回对应路径即可。
- OG 抓取带 3s 超时 + 6 小时缓存 + 基础 SSRF 防护（仅 http/https、拒绝内网/回环地址）。

## 5. 性能 / 反代注意

- **冷启动延迟**：缓存未命中（服务重启、AI 缓存过期）时，首个 `/api/hot` 请求内会同步等 DeepSeek（并行 3 调用）+ OG 富化（≤3s），可能耗时数秒。
  - 反向代理 / 负载均衡的**超时建议 ≥ 30s**。
  - 可在服务启动后预热一次 `GET /api/hot`，让后续请求命中缓存。
- 命中缓存时响应为毫秒级。

## 6. 已知降级（不阻断上线）

- **hupu（虎扑）** 数据源可能处于 `error`（采集波动）。前端已对单平台失败做"维护中"降级展示，**不影响 `/api/hot` 整体**，其余平台与综合热榜正常。上线前可顺带确认是临时波动还是采集失效。
- 单个 OG 图片抓取失败不影响 `/api/hot`，也不会让 AI 整体降级。

## 7. 上线前最后核对

- [ ] `server/.env` 已在服务器配置，且**未提交**到仓库
- [ ] 前端以正确的 `VITE_API_BASE` 重新构建
- [ ] 后端 `CLIENT_ORIGIN` 指向前端实际域名
- [ ] `cd client && npm run build` 通过
- [ ] `cd server && npm run build` 通过
- [ ] 线上 `/api/hot` 字段自检通过、`/api/health` 正常
- [ ] 反代超时 ≥ 30s
