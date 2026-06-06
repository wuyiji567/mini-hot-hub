# 今日热搜 · AI 开发指令

## 项目概述

「今日热搜」是一个 AI 增强的多平台热搜聚合网站。左侧导航栏 + 右侧内容区布局，三个视图：首页（今日最热轮播 + 热点速览 + 综合热榜）、个性推荐、平台热榜。深色科技风主题。

## 版本范围

当前处于 **MVP 第一阶段**，只做以下内容：

- 4 个平台：微博、知乎、B站、GitHub
- 综合热榜（基础聚合排序，不依赖 AI）
- 平台卡片网格
- 内存缓存（`hot:all`，TTL 300 秒）
- 单平台失败降级

**不要在第一阶段实现**：AI 功能、抖音、澎湃/36氪/虎扑/今日头条、个性推荐页内容。这些属于 MVP 第二阶段或未来版。

## 技术栈

- 前端：React + TypeScript + Vite + CSS Modules
- 后端：Node.js + Express + TypeScript
- AI：DeepSeek API（可选，通过 `AI_ENABLED` 环境变量控制）
- 缓存：内存 Map + TTL

## 项目结构

```
mini-hot-hub/
├── client/               # Vite + React
│   └── src/
│       ├── App.tsx        # 根组件：Sidebar + TopBar + 视图切换
│       ├── components/
│       │   ├── Sidebar.tsx
│       │   ├── TopBar.tsx
│       │   ├── views/     # HomeView / PlatformView / InterestView
│       │   ├── RankingList.tsx
│       │   ├── PlatformCard.tsx
│       │   ├── HotItem.tsx
│       │   ├── TagBadge.tsx
│       │   ├── ErrorCard.tsx
│       │   ├── EmptyState.tsx
│       │   └── Toast.tsx
│       ├── hooks/useHotData.ts
│       ├── api/fetchHot.ts
│       ├── types/index.ts
│       └── styles/
├── server/
│   ├── index.ts           # Express 入口
│   ├── routes/hot.ts      # /api/hot 路由
│   ├── services/          # weibo.ts / zhihu.ts / bilibili.ts / github.ts
│   ├── ranking/buildRanking.ts
│   ├── ai/                # deepseek.ts / prompts.ts / parser.ts（第二阶段）
│   └── utils/cache.ts
```

## 核心类型（必须严格遵守）

```typescript
type Source = "weibo" | "zhihu" | "bilibili" | "github"
  | "thepaper" | "kr36" | "hupu" | "toutiao" | "douyin";

interface HotItem {
  rank: number;
  title: string;
  heat?: string;         // 原始热度文本，只展示，不用于跨平台排序
  url: string;
  tags: string[];        // AI 不可用时为空数组
}

interface HotPlatform {
  source: Source;
  name: string;
  listName: string;
  status: "ok" | "error";
  updatedAt: string | null;
  items: HotItem[];
  errorMessage?: string;
}

interface RankingItem {
  rank: number;          // 1~20，序号连续不重复
  title: string;
  url: string;
  heat: string;
  platforms: Source[];
  score: number;
  trend: "up" | "down" | "flat";
}

interface HotResponse {
  updatedAt: string;
  stale?: boolean;
  message?: string;
  ai: {
    available: boolean;
    status: "ready" | "pending" | "unavailable";
    featured: AIFeatured[];
    recommendations: AIRecommend[];
  };
  ranking: RankingItem[];    // 顶层，不在 ai 内部，不依赖 AI
  sources: HotPlatform[];
}
```

## 接口规范

- `GET /api/hot` — 全量数据（ranking + sources + ai）
- `GET /api/hot/:source` — 单平台数据
- source 枚举中，36氪统一用 `kr36`；上游返回 `36kr` 时后端映射
- 无效 source 返回 404

## 编码规范

- 组件名 PascalCase（`HotItem`），函数/变量 camelCase（`fetchHot`）
- 使用函数式组件 + Hooks，不用 class 组件
- 前端禁止直接 fetch 微博/知乎/B站等原始域名，所有数据走 `/api/hot`
- 样式用 CSS Modules 或普通 CSS，不引入 UI 框架
- 前后端类型定义保持一致，共享 `types/index.ts` 的接口定义

## 设计规范

- 深色主题：背景 `#0b0f19`，卡片 `#151c2c`，强调色 `#22d3ee`（青），热度 `#f43f5e`（玫红）
- 排名 1~3 金银铜高亮（`#fbbf24` / `#94a3b8` / `#fb923c`）
- 综合热榜两列，序号 1~20 连续不重复（左列 1~10，右列 11~20）
- 轮播箭头：窄长方形（约 44×64px），接近透明（15%），hover 加深，不遮挡文字
- 侧边栏 200px 固定，移动端（<768px）隐藏 + 汉堡按钮

## 综合热榜算法

不同平台热度单位不统一，禁止直接比较 `heat` 字符串。使用分数排序：

```
score = max(0, 50 - rank) + (出现平台数 - 1) * 15 + sourceWeight
```

sourceWeight：weibo=5, zhihu=5, bilibili=4, github=4, other=3

去重：标题完全相同视为同一事件。宁可少合并，不要错误合并。

## 降级规则（必须遵守）

- 单平台失败 → 该平台 `status: "error"`，其他平台正常，不拖垮整页
- AI 不可用 → `ai.available: false`，ranking 和 sources 正常返回
- 缓存过期 + 抓取失败 → 返回旧缓存 + `stale: true`
- 后端整体不可用 → 前端显示全局错误页 + 重试按钮

## 缓存规则

- MVP 第一阶段：单个 `hot:all` 缓存完整响应，TTL 默认 300 秒（可通过 `CACHE_TTL` 环境变量调整）
- 缓存命中直接返回，不打上游
- 开发环境 `?refresh=1` 跳过缓存
- 10 分钟内重复刷新不能疯狂请求上游

## 环境变量

```bash
PORT=3001
DEEPSEEK_API_KEY=your_api_key
DEEPSEEK_MODEL=replace_with_supported_model
AI_ENABLED=false              # 第一阶段默认关闭
CACHE_TTL=300
VITE_API_BASE=http://localhost:3001
```

## 安全与合规

- 上游请求加合理 User-Agent 和 Referer（按各平台要求）
- 不提交 API Key、密钥等敏感信息到 Git
- 图片使用分类默认图（`/images/category/*.jpg`），AI 不编造图片 URL
- 页脚注明：学习项目、非商用、数据来源于公开信息

## 开发代理

- Vite `vite.config.ts` 将 `/api` 代理到 `http://localhost:3001`
- 生产环境通过 `VITE_API_BASE` 指向后端域名

## 测试要求

- 每完成一个平台 service，验证返回 ≥10 条数据且符合 `HotItem` 类型
- 测试单平台挂掉时其他平台仍正常渲染
- 测试缓存命中时不重复请求上游
- 测试 `ai.available: false` 时前端 AI 区域正确降级

## 实施顺序

1. 搭建 client/ + server/ 项目结构
2. `GET /api/hot` 返回 mock 数据
3. 首页 UI（Sidebar + TopBar + RankingList）+ 平台页 UI
4. 接入微博、知乎、B站、GitHub
5. 加入 `hot:all` 缓存
6. 实现单平台失败降级
7. 实现综合热榜算法（buildRanking.ts）
8. （第二阶段）接入剩余 4 平台 + AI 功能
