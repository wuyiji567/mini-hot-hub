# 今日热搜 · 第二阶段可执行清单

> 目标：在第一阶段（4 平台真实数据 + 综合热榜 + 缓存降级，已上线）基础上，补齐 PRD 完整 MVP——
> **新增 4 个平台**、**接入 AI（分类标签 / 今日最热 / 热点速览 / 个性推荐）**、**补全首页三段式与个性推荐视图**。
> 完成后即对应 PRD 定义的完整 MVP。下周评审为目标。

## 约束（与第一阶段一致）

- 不改 `HotResponse` 类型结构（字段已在 PRD/TECH_DESIGN 定义好，直接填充）。
- 不解析 HTML，平台数据走公开 JSON；AI 不编造图片 URL（用分类默认图）。
- AI 是**增强能力**：AI 挂掉/超时/格式错时，综合热榜与平台视图必须照常。
- 不提交 `.env` / `DEEPSEEK_API_KEY` / token / cookie。
- 抖音、登录态个性化、实时推送属**第三阶段（未来版）**，本阶段不做。

## 关键数据契约（已在 PRD 定义，照此实现）

- `ai.status`: `"ready"`（已生成）/ `"pending"`（生成中）/ `"unavailable"`（不可用）
- `ai.featured[]`: 今日最热 5 条（`section:"featured"`）+ 热点速览 8~10 条（`section:"quick"`），两者不重复
- `ai.recommendations[]`: 个性推荐，`reasonType:"follow"|"similar"`
- `HotItem.tags`: 每条最多 2 个标签，来自固定 11 类枚举，非法标签后端过滤
- 标签枚举：`科技 娱乐 体育 财经 社会 游戏 教育 汽车 国际 生活 其他`

---

## 推荐执行顺序（按依赖 + 评审价值排序）

**两条并行轨：**
- **前端轨**：组 0 视觉改版落地 → D/E/F 用新视觉写新组件
- **后端轨**：A 平台 → B AI 地基 → C AI 内容
- 两轨独立（改版只动样式、后端不碰视觉），最后 G 联调收尾。

即使时间不够，做到 A+部分 D 也能演示「8 平台」；A+B+C1+F2 能演示「带 AI 标签」。

---

## 组 0. 前端：整站视觉改版落地（前端轨起点，与 A/B 并行）

> 来源：Claude Design 的整站视觉改版 HTML/CSS 静态稿（保留侧边栏 + 三视图结构）。
> **先改版再写第二阶段 UI**，避免新组件画两遍皮。
> 铁律：只动 `*.module.css` 与 JSX 结构，**不碰** `useHotData` / `fetchHot` / 类型 / 后端，保证已上线数据链路不破。

- [ ] **0-0** 把设计稿放进 `docs/redesign/`（HTML/CSS），作为还原基准
- [ ] **0-1** 抽取设计 token：配色/字体/圆角/间距更新进 `client/src/styles/variables.css`（沿用 CSS 变量，不引 UI 框架）
- [ ] **0-2** 重构现有组件到新视觉：`Sidebar` / `TopBar` / `RankingList` / `PlatformCard` / `HotItem`（仅样式+结构，props 不变）
- [ ] **0-3** 全局样式 `global.css` 与 Loading/Empty/Error/Toast 视觉对齐改版稿
- [ ] **0-4** 逐屏比对设计稿：首页（综合热榜）、平台页还原度；移动端断点不破
- [ ] **0-5** `npm run build` 通过，线上数据链路（fetchHot/VITE_API_BASE）不受影响

**验收**：首页与平台页视觉与改版稿一致；数据、点击跳转、刷新、降级行为全部照旧。

## A. 后端：新增 4 个平台（独立、低风险，最先做）

> 复用第一阶段 service 模式：`fetch` 公开 JSON → 解析为 `HotItem[]` → 错误抛清晰异常由 `fetchPlatform` 降级。
> `MOCK_FAIL_<SOURCE>` 开关已通用，无需改。接口已调研实测（见文末「平台接口调研结果」）。

- [ ] **A1** `server/services/toutiao.ts`（今日头条）：`GET toutiao.com/hot-event/hot-board`，`data[].Title/ClusterId`，≥10 条
- [ ] **A2** `server/services/thepaper.ts`（澎湃）：`GET cache.thepaper.cn/contentapi/wwwIndex/rightSidebar`，`data.hotNews[].name/contId`
- [ ] **A3** `server/services/kr36.ts`（36氪）：**POST** `gateway.36kr.com/api/mis/nav/home/nav/rank/hot`，`data.hotRankList[].templateMaterial.widgetTitle/itemId`；上游 `36kr` 映射为 `kr36`
- [ ] **A4** `server/services/hupu.ts`（虎扑）：⚠️ 无稳定公开 JSON，**做成可降级平台**（接入失败显示「数据源维护中」，不阻塞其余 7 平台）
- [ ] **A5** 在 `server/services/index.ts` 的 `SERVICES` 注册表加入新平台；`/api/hot` 默认聚合扩到 8 平台（虎扑可降级）
- [ ] **A6** 验证 `/api/hot?refresh=1`：各平台返回正常，单平台失败不拖垮其他；`ranking` 仍 ≥15 条

**验收**：7 个平台真实数据 + 虎扑明确降级态；任一平台故障其余正常。

## B. 后端：AI 基础设施（地基，C 依赖它）

- [ ] **B1** 环境变量：`AI_ENABLED`、`DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`；更新 `server/.env.example`（不填真实 key）
- [ ] **B2** `server/ai/deepseek.ts`：DeepSeek 调用封装；模型从 `DEEPSEEK_MODEL` 读，**不硬编码**；超时 10s；失败抛错
- [ ] **B3** `server/ai/prompts.ts`：Prompt 模板（标签分类 / 事件归纳+热门原因 / 推荐理由），输入为各平台 `HotItem` 精简列表
- [ ] **B4** `server/ai/parser.ts`：解析 AI 返回 JSON + 校验（过滤非法标签、截断超长文案、丢弃缺字段项）
- [ ] **B5** 分类默认图：`client/public/images/category/*.jpg`（11 类），`imageUrl` 由后端按分类映射，AI 不产图
- [ ] **B6** AI 缓存与状态机：`ai:result` 缓存；`ai.status` 的 ready/pending/unavailable 流转；失败短期熔断避免反复调用

**验收**：`AI_ENABLED=false` 时后端仍正常返回基础热榜 + `ai.status:"unavailable"`；开启后能调用成功。

## C. 后端：AI 三块内容生成（依赖 B）

- [ ] **C1** AI 分类标签：给每条 `HotItem.tags` 填 1~2 个合法标签；非法/超量过滤；含「汽车」类
- [ ] **C2** AI 今日最热 + 热点速览：生成 `ai.featured`（5 条 featured + 8~10 条 quick，不重复），含 `hotReason` 可解释依据
- [ ] **C3** AI 个性推荐：生成 `ai.recommendations`（基于预设标签 `["科技","财经","社会"]` + 相似主题）
- [ ] **C4** 路由整合：基础热榜先就绪，AI 后台生成；`pending` 时先返回基础数据，完成后写缓存；超时/异常→`unavailable`

**验收**：`ai.status:"ready"` 时 featured 5 条、quick 8~10 条、recommendations 有数据；AI 超时(>10s)→`unavailable`，综合热榜不受影响。

## D. 前端：首页 AI 区域（把占位换成真内容）

- [ ] **D1** 今日最热轮播大卡片（5 条）：全宽配图+渐变遮罩、分类标签、事件标题、AI 热门原因（青色竖线高亮）、热度/平台数/趋势；箭头窄长方形近透明、不遮文字；圆点指示器；5s 自动轮播、操作后暂停
- [ ] **D2** 热点速览小卡片轮播：每页 2 张，样式同今日最热（图 160px）；箭头翻页
- [ ] **D3** AI 降级态：`pending`→显示「AI 内容生成中」并首次加载 30s 后**自动重试一次**（不轮询）；`unavailable`→显示「AI 推荐暂时不可用」或隐藏
- [ ] **D4** 综合热榜条目补充 AI 标签展示（已有标签组件，复用）

**验收**：首页三段式完整；AI 不可用时今日最热/热点速览降级，综合热榜照常。

## E. 前端：个性推荐视图（把占位换成真内容）

- [ ] **E1** 顶部标签筛选栏（11 类 + 「全部」），移动端横向滚动
- [ ] **E2** 纵向大卡片列表（样式同今日最热）：推荐原因标签（你关注·青 / 相似主题·紫）、AI 推荐理由、热度/来源/讨论平台数
- [ ] **E3** 纯前端标签过滤；无结果显示「该分类下暂无热搜」
- [ ] **E4** 兴趣标签存 `localStorage`，未选用默认 `["科技","财经","社会"]`
- [ ] **E5** 侧边栏热门标签点击 → 跳个性推荐并自动筛选对应标签

**验收**：个性推荐展示 AI 大卡片列表，标签筛选可用，降级有提示。

## F. 前端：平台视图增强

- [ ] **F1** 平台卡片从 4 → 8（微博/知乎/B站/澎湃/36氪/虎扑/GitHub/头条）
- [ ] **F2** 每条热搜显示 1~2 个 AI 彩色标签；提供完整标签筛选栏，点击后各卡片仅显示匹配条目，「全部」恢复
- [ ] **F3** 「汽车」标签纳入枚举与配色

**验收**：8 平台卡片 + 标签筛选；筛选无结果有空状态。

## G. 联调 / 降级 / 文档 / 部署

- [ ] **G1** 端到端：`AI_ENABLED=true` 跑通 8 平台 + AI 三块；`AI_ENABLED=false` 基础热榜照常
- [ ] **G2** 降级演练：AI 超时/格式错 → `unavailable`，页面不崩；单平台 `MOCK_FAIL_*` → 仅该平台 error
- [ ] **G3** 两端 `npm run build` 通过；`server npm start` 生产可启动
- [ ] **G4** 更新 README：8 平台数据源表、AI 环境变量、AI 降级说明
- [ ] **G5** Railway 加 AI 环境变量（`DEEPSEEK_API_KEY` 等）并重新部署；线上验证
- [ ] **G6** AI 内容合规标注：「AI 推荐和标签由 AI 自动生成，仅供参考」

**验收**（对照 PRD 工程指标）：8 平台真实数据、今日最热 5 条、热点速览翻页、综合热榜 ≥15、个性推荐可用、AI 标签覆盖率 >90%、AI 不可用时基础功能正常、公网 HTTPS 可访问。

---

## 一周建议节奏（前端 / 后端双轨并行）

| 时段 | 前端轨 | 后端轨 |
|------|--------|--------|
| Day 1 | 组 0-0~0-2：设计 token + 重构现有组件 | A1~A3：头条/澎湃/36氪接入 |
| Day 2 | 组 0-3~0-5：全局样式对齐 + 还原比对 | A4~A6：虎扑降级 + 8 平台跑通 |
| Day 3 | （改版收尾、待 AI 数据） | B1~B6：AI 地基 |
| Day 4 | D1~D4：今日最热轮播 + 热点速览（新视觉） | C1~C4：AI 标签 + featured/quick + 推荐 |
| Day 5 | E + F：个性推荐视图 + 平台 8 卡 + 标签筛选 | （配合联调） |
| Day 6 | G1~G6：联调、降级演练、文档、部署上线 | — |
| Day 7 | 缓冲：评审彩排、修 bug、截图/演示稿 | — |

## 评审兜底优先级（时间不够时按此保）

1. **必保**：组 0（新视觉）+ A（多平台真实）+ C1/F2（AI 分类标签）—— 改版后的界面 + 最直观的「AI 增强」证据
2. **强烈建议**：C2/D1（今日最热轮播）—— 首页最吸睛的展示点
3. **尽量**：C3/E（个性推荐）
4. 全程保证：AI 挂了也能演示基础热榜（降级是加分项，别让演示翻车）

---

## 附：平台接口调研结果（已 curl 实测）

| 平台 | 接口 | 方法 | 数据路径 | 链接构造 | 状态 |
|------|------|------|----------|----------|------|
| 头条 `toutiao` | `https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc` | GET | `data[]` → `Title`/`ClusterId`/`HotValue` | `toutiao.com/trending/<ClusterId>/` | ✅ 干净 JSON |
| 澎湃 `thepaper` | `https://cache.thepaper.cn/contentapi/wwwIndex/rightSidebar` | GET（带 Referer） | `data.hotNews[]` → `name`/`contId` | `thepaper.cn/newsDetail_forward_<contId>` | ✅ 20 条 |
| 36氪 `kr36` | `https://gateway.36kr.com/api/mis/nav/home/nav/rank/hot` | POST（JSON body，`timestamp` 用 `Date.now()`） | `data.hotRankList[].templateMaterial` → `widgetTitle`/`itemId`/`statRead` | `36kr.com/p/<itemId>` | ✅ 30 条 |
| 虎扑 `hupu` | 无稳定公开 JSON（参考项目用 HTML 解析） | — | — | — | ⚠️ 做可降级平台 |

> 写 service 时请求头带合理 `User-Agent`；澎湃/36氪带 `Referer`；统一 10s 超时；失败抛清晰错误由 `fetchPlatform` 降级。虎扑若后续找到稳定 JSON 或愿意破例 HTML 解析，再补真实数据。
