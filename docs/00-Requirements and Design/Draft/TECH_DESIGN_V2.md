# 今日热搜 · 技术设计 V2

> 本文件是在 `TECH_DESIGN.md` 基础上的修订版。原文件保留不动。

## 目标

做一个聚合多平台热搜的小网站。用户打开首页后，可以在一个页面里看到微博、知乎、B 站、GitHub 等平台的热门内容，并查看一个基础综合热榜。

第一版的核心目标是：**先稳定展示热榜**。AI 总结、个性推荐、抖音等高风险功能作为增强能力，不能影响基础热榜可用性。

## 版本范围

| 阶段 | 范围 | 说明 |
|------|------|------|
| MVP | 微博、知乎、B 站、GitHub；综合热榜；平台卡片；基础缓存；错误降级 | 第一版优先完成，确保项目能跑通 |
| 增强版 | 澎湃、36氪、虎扑、今日头条；AI 热门原因；分类标签 | 基础功能稳定后再接入 |
| 未来版 | 抖音；真正个性推荐；AI 异步补齐；更复杂趋势算法 | 难度更高，避免拖慢第一版 |

## 技术栈

- 前端：React + TypeScript + Vite + CSS Modules（深色科技风主题）
- 后端：Node.js + Express + TypeScript
- AI：DeepSeek API，可选能力；模型通过环境变量配置，默认使用当前可用模型，如 `deepseek-v4-flash`
- 缓存：MVP 使用内存 Map，完整响应缓存 300 秒；后续再拆分单平台缓存
- 部署：前端 Vercel / 后端 Railway（示例，不锁死方案）

### 环境变量

```bash
PORT=3001
DEEPSEEK_API_KEY=your_api_key
DEEPSEEK_MODEL=deepseek-v4-flash
AI_ENABLED=false
VITE_API_BASE=http://localhost:3001
```

说明：

- `AI_ENABLED=false` 时，后端不调用 AI，仍然返回基础热榜。
- `DEEPSEEK_MODEL` 不在代码里写死，避免模型名称或价格变化后需要改代码。
- DeepSeek 价格按实际 token 消耗计费，文档不固定写死月成本，只保留估算方法。

## 架构图

```
┌─────────────┐     GET /api/hot      ┌──────────────────────────────────────┐
│  访客浏览器  │ ────────────────────► │             Express 后端             │
│  React SPA  │ ◄──────────────────── │                                      │
│             │     JSON Response     │  ┌────────┐      ┌───────────────┐   │
│ 首页视图     │                       │  │ 路由层  │ ───► │ 内存缓存 Map   │   │
│ 平台视图     │                       │  │ /api/hot│      │ hot:all       │   │
│ 推荐视图     │                       │  └───┬────┘      │ TTL 300 秒    │   │
└─────────────┘                           │           └───────┬───────┘   │
                                          │                   │           │
                                          ▼                   ▼           │
                                   并发请求数据源         命中则直接返回     │
                                          │                               │
                       ┌──────────────────┴──────────────────┐            │
                       │ 微博 / 知乎 / B 站 / GitHub / 更多平台 │            │
                       └──────────────────┬──────────────────┘            │
                                          ▼                               │
                                 统一解析为 HotItem[]                     │
                                          │                               │
                                          ▼                               │
                         基础聚合生成 ranking，不依赖 AI                  │
                                          │                               │
                         ┌────────────────┴────────────────┐              │
                         │ AI 可用且开启？                  │              │
                         │ 是：补充标签、热门原因、推荐       │              │
                         │ 否：返回空 AI 数据                │              │
                         └────────────────┬────────────────┘              │
                                          ▼                               │
                                   写入缓存 + 返回                         │
└──────────────────────────────────────────────────────────────────────────┘
```

## 核心数据流

1. 用户打开页面，React 前端请求 `GET /api/hot`。
2. Express 后端先查缓存。
3. 缓存命中，直接返回完整响应。
4. 缓存未命中，并发请求各平台 JSON 接口。
5. 各平台 service 将不同来源的数据统一解析成 `HotItem[]`。
6. 后端用基础算法生成 `ranking` 综合热榜，这一步不依赖 AI。
7. 如果 `AI_ENABLED=true` 且 AI 服务可用，再补充 AI 标签、热门原因和推荐内容。
8. 如果 AI 超时或失败，返回 `ai.available=false`，基础热榜正常返回。
9. 最终响应写入缓存，前端渲染首页和平台页。

MVP 不做真正的“AI 异步补齐”。如果未来需要首屏先返回基础数据、之后再补 AI，可以新增 `GET /api/hot/ai`。

## 项目结构

```text
mini-hot-hub/
├── client/                          # Vite + React 前端
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx                 # 应用入口
│   │   ├── App.tsx                  # 根组件：布局 + 视图切换
│   │   ├── components/
│   │   │   ├── Sidebar.tsx          # 左侧导航
│   │   │   ├── TopBar.tsx           # 顶栏
│   │   │   ├── views/
│   │   │   │   ├── HomeView.tsx     # 首页：综合热榜 + AI 区域
│   │   │   │   ├── PlatformView.tsx # 平台热榜
│   │   │   │   └── InterestView.tsx # 推荐视图，MVP 可先隐藏
│   │   │   ├── RankingList.tsx      # 综合热榜
│   │   │   ├── PlatformCard.tsx     # 单个平台卡片
│   │   │   ├── HotItem.tsx          # 单条热搜
│   │   │   ├── TagBadge.tsx         # 标签
│   │   │   ├── ErrorCard.tsx        # 单平台错误态
│   │   │   ├── EmptyState.tsx       # 空状态
│   │   │   └── Toast.tsx            # 轻量提示
│   │   ├── hooks/
│   │   │   └── useHotData.ts        # 数据获取 Hook
│   │   ├── api/
│   │   │   └── fetchHot.ts          # API 请求封装
│   │   ├── types/
│   │   │   └── index.ts             # 前端类型
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   └── variables.css
│   │   └── utils/
│   │       └── helpers.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── server/
│   ├── index.ts                     # Express 入口
│   ├── routes/
│   │   └── hot.ts                   # /api/hot 路由
│   ├── services/
│   │   ├── weibo.ts                 # MVP
│   │   ├── zhihu.ts                 # MVP
│   │   ├── bilibili.ts              # MVP
│   │   ├── github.ts                # MVP
│   │   ├── thepaper.ts              # 增强版
│   │   ├── kr36.ts                  # 增强版，36氪统一映射为 kr36
│   │   ├── hupu.ts                  # 增强版
│   │   ├── toutiao.ts               # 增强版
│   │   ├── douyin.ts                # 未来版，高风险，可降级
│   │   └── index.ts                 # 统一导出 + 并发调度
│   ├── ranking/
│   │   └── buildRanking.ts          # 综合热榜算法
│   ├── ai/
│   │   ├── deepseek.ts              # AI 调用封装，可选
│   │   ├── prompts.ts               # Prompt 模板
│   │   └── parser.ts                # AI JSON 解析 + 校验
│   ├── utils/
│   │   └── cache.ts                 # 内存缓存 Map + TTL
│   ├── types/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## 数据模型

### Source

```typescript
type Source =
  | "weibo"
  | "zhihu"
  | "bilibili"
  | "github"
  | "thepaper"
  | "kr36"
  | "hupu"
  | "toutiao"
  | "douyin";
```

### HotItem（单条热搜）

```typescript
interface HotItem {
  rank: number;              // 平台内排名
  title: string;             // 标题
  heat?: string;             // 原始热度文本，如 "534万"；只展示，不直接用于跨平台排序
  url: string;               // 原始链接
  tags: string[];            // 分类标签；AI 不可用时为空数组
}
```

### HotPlatform（单平台数据）

```typescript
interface HotPlatform {
  source: Source;            // 平台标识
  name: string;              // 平台中文名，如 "微博"
  listName: string;          // 榜单名，如 "热搜榜"
  status: "ok" | "error";
  updatedAt: string | null;  // ISO8601；失败时为 null
  items: HotItem[];
  errorMessage?: string;
}
```

### RankingItem（综合热榜条目）

```typescript
interface RankingItem {
  rank: number;              // 全局排名 1~20
  title: string;
  url: string;
  heat: string;              // 展示用综合热度，可由分数转成文案
  platforms: Source[];       // 出现在哪些平台
  score: number;             // 后端计算出的排序分数，前端可不展示
  trend: "up" | "down" | "flat";
}
```

### AIFeatured（AI 增强卡片）

```typescript
interface AIFeatured {
  eventTitle: string;
  hotReason: string;
  tag: string;
  imageUrl: string;          // MVP 使用分类默认图，不让 AI 编造图片
  platforms: {
    source: Source;
    rank: number;
  }[];
  heat: string;
  trend: string;
  section: "featured" | "quick";
}
```

### AIRecommend（推荐卡片）

```typescript
interface AIRecommend {
  eventTitle: string;
  reasonType: "follow" | "similar";
  reasonLabel: string;
  aiReason: string;
  imageUrl: string;          // 使用分类默认图
  platform: Source;
  platformCount: number;
  heat: string;
  tags: string[];
}
```

### HotResponse（顶层响应）

```typescript
interface HotResponse {
  updatedAt: string;
  stale?: boolean;           // 返回过期缓存时为 true
  message?: string;          // 如 "数据可能已过期"
  ai: {
    available: boolean;
    featured: AIFeatured[];
    recommendations: AIRecommend[];
  };
  ranking: RankingItem[];
  sources: HotPlatform[];
}
```

## 接口设计

### GET /api/hot

返回完整热搜数据，包括综合热榜、各平台数据，以及可选 AI 数据。

MVP 中，前端只依赖：

- `ranking`
- `sources`
- `ai.available`

如果 `ai.featured` 和 `ai.recommendations` 为空，前端正常隐藏 AI 区域。

### GET /api/hot/:source

返回单个平台数据。

`source` 枚举：

`weibo` | `zhihu` | `bilibili` | `github` | `thepaper` | `kr36` | `hupu` | `toutiao` | `douyin`

说明：

- 36氪在业务内部统一使用 `kr36`。
- 如果第三方数据源返回 `36kr`，后端进入业务响应前映射为 `kr36`。
- 无效平台返回 404。

### GET /api/hot/ai（未来版）

仅当需要“首屏先返回基础热榜，稍后补 AI”时再新增。

MVP 暂不实现该接口，避免前端状态和缓存逻辑变复杂。

## 成功响应示例

```json
{
  "updatedAt": "2026-06-06T10:30:00Z",
  "ai": {
    "available": false,
    "featured": [],
    "recommendations": []
  },
  "ranking": [
    {
      "rank": 1,
      "title": "国产大模型发布会引热议",
      "url": "https://example.com/1",
      "heat": "综合热度 96",
      "platforms": ["zhihu", "bilibili", "weibo"],
      "score": 96,
      "trend": "up"
    },
    {
      "rank": 2,
      "title": "高考首日各地启动交通管制",
      "url": "https://example.com/2",
      "heat": "综合热度 91",
      "platforms": ["weibo", "toutiao"],
      "score": 91,
      "trend": "flat"
    }
  ],
  "sources": [
    {
      "source": "weibo",
      "name": "微博",
      "listName": "热搜榜",
      "status": "ok",
      "updatedAt": "2026-06-06T10:29:45Z",
      "items": [
        {
          "rank": 1,
          "title": "高考首日现场",
          "heat": "534万",
          "url": "https://s.weibo.com/weibo?q=高考首日现场",
          "tags": []
        }
      ]
    }
  ]
}
```

## 失败响应示例

### 单平台失败，其他平台正常

```json
{
  "updatedAt": "2026-06-06T10:30:00Z",
  "ai": {
    "available": false,
    "featured": [],
    "recommendations": []
  },
  "ranking": [
    {
      "rank": 1,
      "title": "高考首日现场",
      "url": "https://s.weibo.com/weibo?q=高考首日现场",
      "heat": "综合热度 88",
      "platforms": ["weibo"],
      "score": 88,
      "trend": "up"
    }
  ],
  "sources": [
    {
      "source": "weibo",
      "name": "微博",
      "listName": "热搜榜",
      "status": "ok",
      "updatedAt": "2026-06-06T10:29:45Z",
      "items": [
        {
          "rank": 1,
          "title": "高考首日现场",
          "heat": "534万",
          "url": "https://s.weibo.com/weibo?q=高考首日现场",
          "tags": []
        }
      ]
    },
    {
      "source": "douyin",
      "name": "抖音",
      "listName": "热点榜",
      "status": "error",
      "updatedAt": null,
      "items": [],
      "errorMessage": "数据源暂时不可用"
    }
  ]
}
```

### 缓存过期，新抓取失败

```json
{
  "updatedAt": "2026-06-06T10:00:00Z",
  "stale": true,
  "message": "数据可能已过期，正在显示上一次成功获取的结果",
  "ai": {
    "available": false,
    "featured": [],
    "recommendations": []
  },
  "ranking": [],
  "sources": []
}
```

## 综合热榜算法

不同平台的热度单位不统一，不能直接拿 `heat` 字符串比较。

MVP 使用简单可解释的分数算法：

```text
score =
  rankScore
  + platformBonus
  + sourceWeight
```

### rankScore

平台内排名越靠前，分数越高。

```text
rankScore = max(0, 50 - rank)
```

例如：

- 平台第 1 名：49 分
- 平台第 10 名：40 分
- 平台第 30 名：20 分

### platformBonus

同一事件出现在多个平台时加分。

```text
platformBonus = (出现平台数 - 1) * 15
```

### sourceWeight

不同平台可以给一个轻微权重，但 MVP 先保持简单。

```text
weibo: 5
zhihu: 5
bilibili: 4
github: 4
other: 3
```

### 去重规则

MVP 先用标题相似度做粗略去重：

1. 去掉空格、标点、常见前缀。
2. 标题完全相同，视为同一事件。
3. 标题包含关系明显，比如“高考首日现场”和“高考首日各地交通管制”，可先不强行合并，交给 AI 增强版处理。

说明：第一版宁可少合并，也不要错误合并不同事件。

## AI 设计

AI 是增强能力，不是基础链路。

### AI 做什么

- 给热搜生成 1 到 2 个分类标签。
- 为首页生成“热门原因”。
- 基于默认兴趣标签生成推荐卡片。

### AI 不做什么

- 不负责生成综合热榜。
- 不负责判断数据是否真实。
- 不负责生成图片 URL。
- 不影响基础热榜展示。

### 个性推荐来源

MVP 不做登录和用户系统。推荐基于浏览器本地保存的兴趣标签：

```typescript
type InterestTag =
  | "科技"
  | "财经"
  | "社会"
  | "娱乐"
  | "体育"
  | "游戏"
  | "教育"
  | "汽车"
  | "国际"
  | "生活";
```

默认兴趣：

```json
["科技", "财经", "社会"]
```

用户选择的兴趣标签保存在 `localStorage`。如果用户没有选择，就使用默认兴趣。

### AI 超时与校验

- 超时：10 秒。
- 输出格式：结构化 JSON。
- 校验：后端过滤非法标签、截断过长文案、丢弃缺少必要字段的结果。
- 失败：返回 `ai.available=false`，前端隐藏 AI 区域或显示轻量占位。

### 成本估算方式

不在文档里固定写死月成本。实际成本按下面公式估算：

```text
月成本 = 每次输入 token * 输入单价 * 每月调用次数
       + 每次输出 token * 输出单价 * 每月调用次数
```

调用频率建议：

- MVP：默认关闭 AI。
- 增强版：每 10 分钟最多调用一次。
- 本地开发：手动刷新才调用，避免浪费额度。

## 图片策略

AI 卡片需要图片，但不让 AI 编造图片 URL。

MVP 使用“分类默认图”：

```typescript
const CATEGORY_IMAGES = {
  科技: "/images/category/tech.jpg",
  财经: "/images/category/finance.jpg",
  社会: "/images/category/society.jpg",
  娱乐: "/images/category/entertainment.jpg",
  体育: "/images/category/sports.jpg",
  游戏: "/images/category/gaming.jpg",
  教育: "/images/category/education.jpg",
  汽车: "/images/category/auto.jpg",
  国际: "/images/category/world.jpg",
  生活: "/images/category/life.jpg"
};
```

后续可以接入图片搜索、新闻图源或人工维护图片库。

## 页面流程

### 1. 页面加载

1. 用户打开页面。
2. React 渲染基础布局和骨架屏。
3. `useHotData` 请求 `GET /api/hot`。
4. 数据返回后渲染：
   - 首页：综合热榜 + AI 区域。
   - 平台页：各平台热榜卡片。
   - 推荐页：有 AI 推荐时展示；没有时隐藏或提示“暂未开启推荐”。

### 2. 视图切换

- 视图切换是纯前端行为，不重新请求接口。
- 点击侧边栏导航项后，用 React state 切换当前视图。
- 标签筛选只筛选当前已加载数据。

### 3. 手动刷新

- 用户点击刷新按钮，请求 `GET /api/hot`。
- 默认仍走缓存。
- 开发环境支持 `GET /api/hot?refresh=1` 跳过缓存。
- 刷新失败时保留旧数据，并提示“刷新失败，显示的是之前的数据”。

## 缓存策略

MVP 只保留一个完整响应缓存，降低复杂度：

| 缓存对象 | TTL | Key | 说明 |
|----------|-----|-----|------|
| 完整响应 | 300 秒 | `hot:all` | 缓存完整 `/api/hot` 响应 |

后续增强版再拆分：

| 缓存对象 | TTL | Key | 说明 |
|----------|-----|-----|------|
| 单平台数据 | 300 秒 | `hot:{source}` | 各平台独立缓存 |
| AI 结果 | 300 秒 | `ai:result` | 避免频繁调用 AI |

缓存过期后，如果新抓取失败：

1. 有旧缓存：返回旧缓存，并加上 `stale=true`。
2. 没有旧缓存：返回错误响应，前端显示全局错误页。

## 降级策略

| 场景 | 降级行为 |
|------|----------|
| 单平台失败 | 该平台 `status=error`，其他平台正常展示 |
| GitHub 失败 | 不影响中文平台热榜 |
| 抖音失败 | 未来版平台，可隐藏或显示“数据源维护中” |
| AI 未开启 | `ai.available=false`，隐藏 AI 区域 |
| AI 超时或格式错误 | 丢弃 AI 结果，基础热榜正常返回 |
| 缓存过期且新抓取失败 | 有旧缓存则返回旧缓存并标注 `stale=true` |
| 后端整体不可用 | 前端显示全局错误页和重试按钮 |

## 数据方案备注

- 主路线：自建 Express 后端，fetch 各平台 JSON 接口。
- 抓取参考：可参考开源项目 DailyHotApi 的平台列表、请求头和解析思路，但不要固定依赖它的线上免费接口。
- 平台接入顺序：先接稳定平台，再接反爬强或维护成本高的平台。
- 高难度平台：抖音作为未来版能力，优先降级，不阻塞 MVP。
- 不推荐：微博 OAuth、HTML 全页爬虫。它们维护成本高，也更容易遇到限制。
- AI 备选：如果 DeepSeek 不可用，可把 AI 调用封装成统一接口，后续切换 Qwen、OpenAI 或其他模型。

## 实施建议

建议按下面顺序开发：

1. 搭建前后端项目结构。
2. 先实现 `GET /api/hot`，返回 mock 数据。
3. 完成首页和平台页 UI。
4. 接入微博、知乎、B 站、GitHub 四个平台。
5. 加入 `hot:all` 缓存。
6. 实现单平台失败降级。
7. 实现综合热榜算法。
8. 再考虑 AI 标签、热门原因和推荐。

这样项目可以尽早跑起来，不会一开始就被 AI、抖音、复杂推荐卡住。
