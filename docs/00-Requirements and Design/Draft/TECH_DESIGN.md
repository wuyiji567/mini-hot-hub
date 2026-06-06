# 今日热搜 · 技术设计

## 技术栈

- 前端：React + TypeScript + Vite + CSS Modules（深色科技风主题）
- 后端：Node.js + Express + TypeScript
- AI：DeepSeek V3.2 API（中文能力顶尖，月成本约 15~25 元）
- 缓存：内存 Map（TTL 300~600 秒，每个平台独立缓存）
- 部署：前端 Vercel / 后端 Railway（示例，不锁死方案）

## 架构图

```
┌─────────────┐     GET /api/hot      ┌──────────────────────────────────────────┐
│             │ ◄──────────────────── │              Express 后端                │
│  访客浏览器   │                       │                                          │
│  React SPA  │ ────────────────────► │  ┌────────┐    ┌───────────────────────┐ │
│             │     JSON Response     │  │ 路由层   │───►│    内存缓存 (Map)      │ │
│ ┌─────────┐ │                       │  │/api/hot │    │  TTL 5~10 分钟        │ │
│ │ 首页视图 │ │                       │  │/api/hot/│    │  key = 平台名          │ │
│ │ 推荐视图 │ │                       │  │:source  │    └──────┬────────────────┘ │
│ │ 平台视图 │ │                       │  └────────┘           │                  │
│ └─────────┘ │                       │                  命中？│                  │
└─────────────┘                       │               ┌───────┴───────┐         │
                                      │               │ 是            │ 否       │
                                      │               ▼               ▼         │
                                      │          直接返回        并发 fetch       │
                                      │                       各平台 JSON       │
                                      │                              │         │
                                      │                    ┌─────────┴───────┐ │
                                      │                    │   数据解析层      │ │
                                      │                    │ weibo.ts         │ │
                                      │                    │ zhihu.ts         │ │
                                      │                    │ bilibili.ts      │ │
                                      │                    │ douyin.ts (降级)  │ │
                                      │                    │ thepaper.ts      │ │
                                      │                    │ kr36.ts          │ │
                                      │                    │ hupu.ts          │ │
                                      │                    │ github.ts        │ │
                                      │                    │ toutiao.ts       │ │
                                      │                    └─────────┬───────┘ │
                                      │                              │         │
                                      │                              ▼         │
                                      │                    ┌─────────────────┐ │
                                      │                    │  AI 服务层       │ │
                                      │                    │  DeepSeek V3.2  │ │
                                      │                    │                 │ │
                                      │                    │ · 事件聚类       │ │
                                      │                    │ · 热门原因生成    │ │
                                      │                    │ · 分类标签       │ │
                                      │                    │ · 个性推荐       │ │
                                      │                    │                 │ │
                                      │                    │ 超时/失败→降级    │ │
                                      │                    └─────────┬───────┘ │
                                      │                              │         │
                                      │                              ▼         │
                                      │                     写入缓存 + 返回     │
                                      └──────────────────────────────────────────┘
```

**数据流简述**：

1. 用户打开页面 → React 前端请求 `GET /api/hot`
2. Express 路由查内存缓存 → 命中则直接返回
3. 未命中 → 并发 fetch 各平台 JSON 接口 → 各 service 解析为统一 `HotItem[]`
4. 基础聚合：对各平台数据去重排序生成综合热榜（`ranking`），不依赖 AI
5. AI 增强：解析结果批量送 DeepSeek V3.2 → 返回事件聚类、热门原因、分类标签、个性推荐
6. 聚合结果写入缓存 → 返回给前端；首屏优先返回基础热榜，AI 数据允许异步补齐
7. AI 超时（>10s）或失败 → 跳过 AI，基础热搜 + 综合热榜正常返回，前端 AI 区域降级

## 项目结构

```
mini-hot-hub/
├── client/                          # Vite + React 前端
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx                 # 应用入口
│   │   ├── App.tsx                  # 根组件（侧边栏 + 视图切换）
│   │   ├── components/
│   │   │   ├── Sidebar.tsx          # 左侧导航栏
│   │   │   ├── TopBar.tsx           # 顶栏
│   │   │   ├── views/
│   │   │   │   ├── HomeView.tsx     # 首页视图（三段式）
│   │   │   │   ├── InterestView.tsx # 个性推荐视图
│   │   │   │   └── PlatformView.tsx # 平台视图
│   │   │   ├── HotCarousel.tsx      # 今日最热轮播
│   │   │   ├── QuickNews.tsx        # 热点速览小卡片轮播
│   │   │   ├── RankingList.tsx      # 综合热榜（两列，序号 1~20）
│   │   │   ├── InterestCard.tsx     # 个性推荐大卡片
│   │   │   ├── FilterBar.tsx        # 标签筛选栏
│   │   │   ├── PlatformCard.tsx     # 单个平台卡片
│   │   │   ├── HotItem.tsx          # 单条热搜
│   │   │   ├── RankBadge.tsx        # 排名徽章
│   │   │   ├── TagBadge.tsx         # 分类标签
│   │   │   ├── ErrorCard.tsx        # 错误态卡片
│   │   │   ├── EmptyState.tsx       # 空状态
│   │   │   └── Toast.tsx            # 轻量提示
│   │   ├── hooks/
│   │   │   └── useHotData.ts        # 数据获取 Hook
│   │   ├── api/
│   │   │   └── fetchHot.ts          # API 请求封装
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript 类型定义
│   │   ├── styles/
│   │   │   ├── global.css           # 全局样式
│   │   │   └── variables.css        # CSS 变量（深色主题）
│   │   └── utils/
│   │       └── helpers.ts           # 辅助函数（相对时间等）
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── server/                          # Express 后端
│   ├── index.ts                     # 入口，启动 Express
│   ├── routes/
│   │   └── hot.ts                   # /api/hot 路由
│   ├── services/                    # 各平台数据抓取
│   │   ├── weibo.ts
│   │   ├── zhihu.ts
│   │   ├── bilibili.ts
│   │   ├── douyin.ts                # 高难度，可降级
│   │   ├── thepaper.ts
│   │   ├── kr36.ts
│   │   ├── hupu.ts
│   │   ├── github.ts
│   │   ├── toutiao.ts               # 今日头条
│   │   └── index.ts                 # 统一导出 + 并发调度
│   ├── ai/
│   │   ├── deepseek.ts              # DeepSeek API 调用封装
│   │   ├── prompts.ts               # AI Prompt 模板
│   │   └── parser.ts                # AI 响应 JSON 解析 + 校验
│   ├── utils/
│   │   └── cache.ts                 # 内存缓存 Map + TTL
│   ├── types/
│   │   └── index.ts                 # 后端类型定义
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## 数据模型

### HotItem（单条热搜）

```typescript
interface HotItem {
  rank: number;              // 排名
  title: string;             // 标题
  heat?: string;             // 热度值（如 "534万"），部分平台缺失
  url: string;               // 原始链接
  tags?: string[];           // AI 分类标签（如 ["科技", "AI"]），最多 2 个
}
```

### HotPlatform（单平台数据）

```typescript
interface HotPlatform {
  source: string;            // 平台标识：weibo | zhihu | bilibili | douyin | thepaper | kr36 | hupu | github | toutiao
                             // 注意：36氪统一使用 kr36；如上游返回 36kr 需映射
  name: string;              // 平台中文名：微博
  listName: string;          // 榜单名：热搜榜
  status: "ok" | "error";   // 数据状态
  updatedAt: string | null;  // ISO8601 更新时间，error 时为 null
  items: HotItem[];          // 热搜列表（status=ok 时有数据）
  errorMessage?: string;     // 错误信息（status=error 时有值）
}
```

### AIFeatured（今日最热 / 热点速览卡片）

```typescript
interface AIFeatured {
  eventTitle: string;        // AI 归纳的事件标题
  hotReason: string;         // AI 总结的热门原因
  tag: string;               // 分类标签（如 "科技 · AI"）
  imageUrl: string;          // 配图 URL
  platforms: {               // 涉及平台
    source: string;
    rank: number;
  }[];
  heat: string;              // 综合热度值
  trend: string;             // 趋势标签（如 "今晨登顶"）
  section: "featured" | "quick";  // 归属：今日最热 or 热点速览
}
```

### AIRecommend（个性推荐卡片）

```typescript
interface AIRecommend {
  eventTitle: string;        // 事件标题
  reasonType: "follow" | "similar"; // 推荐类型：基于预设关注 or 相似主题
  reasonLabel: string;       // 推荐标签（如 "你关注 · 科技"）
  aiReason: string;          // AI 推荐理由
  imageUrl: string;          // 配图 URL
  platform: string;          // 主要来源平台
  platformCount: number;     // 讨论平台数
  heat: string;              // 热度值
  tags: string[];            // 分类标签
}
```

### RankingItem（综合热榜条目）

```typescript
interface RankingItem {
  rank: number;              // 全局排名 1~20，序号连续不重复
  title: string;             // 标题
  url: string;               // 原始链接
  heat: string;              // 热度值
  platforms: string[];       // 涉及平台标识列表
  trend: "up" | "down" | "flat"; // 趋势方向
}
```

### 接口顶层响应

```typescript
interface HotResponse {
  updatedAt: string;         // 本次数据更新时间
  ai: {
    available: boolean;      // AI 服务是否可用
    featured: AIFeatured[];  // 今日最热 + 热点速览（AI 依赖）
    recommendations: AIRecommend[]; // 个性推荐（AI 依赖）
  };
  ranking: RankingItem[];   // 综合热榜（顶层，不依赖 AI；基础聚合即可生成）
  sources: HotPlatform[];   // 各平台独立数据
}
```

## 接口设计

### GET /api/hot — 全量数据

返回所有平台数据 + AI 推荐 + 综合热榜。

### GET /api/hot/:source — 单平台数据

source 枚举：`weibo` | `zhihu` | `bilibili` | `douyin` | `thepaper` | `kr36` | `hupu` | `github` | `toutiao`。平台标识统一使用 `kr36` 表示 36氪；如后端或第三方源返回 `36kr`，进入业务响应前需映射为 `kr36`。无效值返回 404。

---

### 成功响应示例（GET /api/hot）

```json
{
  "updatedAt": "2026-06-05T10:30:00Z",
  "ai": {
    "available": true,
    "featured": [
      {
        "eventTitle": "高考首日：各地交通管制 + 爱心送考",
        "hotReason": "全国 1098 万考生迎来高考，多地启动最高等级交通管制，爱心送考车队、免费矿泉水等暖心举措引发全网讨论。",
        "tag": "社会 · 民生",
        "imageUrl": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=500&fit=crop",
        "platforms": [
          { "source": "weibo", "rank": 1 },
          { "source": "douyin", "rank": 1 },
          { "source": "toutiao", "rank": 3 }
        ],
        "heat": "1098万",
        "trend": "今晨登顶",
        "section": "featured"
      },
      {
        "eventTitle": "国产大模型发布会引热议：性能对标 GPT-4",
        "hotReason": "多项基准测试超越国际同类产品，首次实现中文场景全面领先，开发者社区评价积极。",
        "tag": "科技 · AI",
        "imageUrl": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=500&fit=crop",
        "platforms": [
          { "source": "zhihu", "rank": 1 },
          { "source": "bilibili", "rank": 4 },
          { "source": "weibo", "rank": 5 }
        ],
        "heat": "964万",
        "trend": "持续升温",
        "section": "featured"
      },
      {
        "eventTitle": "AI 辅助诊断进入基层医院",
        "hotReason": "覆盖 200+ 县级医院，误诊率下降 35%，让优质医疗资源触达基层。",
        "tag": "AI · 医疗",
        "imageUrl": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=300&fit=crop",
        "platforms": [
          { "source": "zhihu", "rank": 4 },
          { "source": "toutiao", "rank": 6 }
        ],
        "heat": "702万",
        "trend": "快速上升",
        "section": "quick"
      }
    ],
    "recommendations": [
      {
        "eventTitle": "国产大模型发布会引热议：性能对标 GPT-4",
        "reasonType": "follow",
        "reasonLabel": "你关注 · 科技",
        "aiReason": "该事件与默认关注标签「科技」匹配，且在多个平台排名靠前。",
        "imageUrl": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=500&fit=crop",
        "platform": "zhihu",
        "platformCount": 3,
        "heat": "964万",
        "tags": ["科技"]
      },
      {
        "eventTitle": "多家车企同日开启价格战",
        "reasonType": "similar",
        "reasonLabel": "相似主题",
        "aiReason": "该事件与你关注的「财经」「科技」主题相关，多平台热度靠前。",
        "imageUrl": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&h=500&fit=crop",
        "platform": "toutiao",
        "platformCount": 2,
        "heat": "688万",
        "tags": ["社会"]
      }
    ]
  },
  "ranking": [
    { "rank": 1, "title": "全国多地气温创入夏新高", "url": "https://example.com/1", "heat": "1286万", "platforms": ["weibo", "toutiao", "zhihu"], "trend": "up" },
    { "rank": 2, "title": "新能源车下乡补贴细则公布", "url": "https://example.com/2", "heat": "1142万", "platforms": ["toutiao", "zhihu", "weibo"], "trend": "up" },
    { "rank": 3, "title": "高考首日各地启动交通管制", "url": "https://example.com/3", "heat": "1098万", "platforms": ["weibo", "douyin", "toutiao"], "trend": "up" },
    { "rank": 4, "title": "国产大模型发布会引热议", "url": "https://example.com/4", "heat": "964万", "platforms": ["zhihu", "bilibili", "weibo"], "trend": "flat" },
    { "rank": 5, "title": "油价或迎年内最大降幅", "url": "https://example.com/5", "heat": "902万", "platforms": ["toutiao", "weibo", "douyin"], "trend": "flat" }
  ],
  "sources": [
    {
      "source": "weibo",
      "name": "微博",
      "listName": "热搜榜",
      "status": "ok",
      "updatedAt": "2026-06-05T10:29:45Z",
      "items": [
        { "rank": 1, "title": "高考首日现场", "heat": "534万", "url": "https://s.weibo.com/weibo?q=高考首日现场", "tags": ["社会"] },
        { "rank": 2, "title": "某剧集大结局", "heat": "492万", "url": "https://s.weibo.com/weibo?q=某剧集大结局", "tags": ["娱乐"] },
        { "rank": 3, "title": "全国多地高温预警", "heat": "450万", "url": "https://s.weibo.com/weibo?q=全国多地高温预警", "tags": ["社会"] }
      ]
    },
    {
      "source": "zhihu",
      "name": "知乎",
      "listName": "热榜",
      "status": "ok",
      "updatedAt": "2026-06-05T10:29:50Z",
      "items": [
        { "rank": 1, "title": "如何看待国产大模型对标 GPT-4？", "heat": "1842万", "url": "https://www.zhihu.com/question/xxx", "tags": ["科技"] },
        { "rank": 2, "title": "高考改革对考生有哪些影响？", "heat": "1567万", "url": "https://www.zhihu.com/question/yyy", "tags": ["教育", "社会"] }
      ]
    }
  ]
}
```

### 失败响应示例

#### 单平台失败（其他平台正常）

```json
{
  "updatedAt": "2026-06-05T10:30:00Z",
  "ai": {
    "available": true,
    "featured": [],
    "recommendations": []
  },
  "ranking": [
    { "rank": 1, "title": "高考首日现场", "url": "https://s.weibo.com/weibo?q=高考首日现场", "heat": "534万", "platforms": ["weibo"], "trend": "up" }
  ],
  "sources": [
    {
      "source": "weibo",
      "name": "微博",
      "listName": "热搜榜",
      "status": "ok",
      "updatedAt": "2026-06-05T10:29:45Z",
      "items": [
        { "rank": 1, "title": "高考首日现场", "heat": "534万", "url": "https://s.weibo.com/weibo?q=高考首日现场", "tags": ["社会"] }
      ]
    },
    {
      "source": "douyin",
      "name": "抖音",
      "listName": "热点榜",
      "status": "error",
      "updatedAt": null,
      "items": [],
      "errorMessage": "数据源暂时不可用，签名校验失败"
    }
  ]
}
```

#### AI 服务不可用（基础热搜 + 综合热榜正常）

```json
{
  "updatedAt": "2026-06-05T10:30:00Z",
  "ai": {
    "available": false,
    "featured": [],
    "recommendations": []
  },
  "ranking": [
    { "rank": 1, "title": "高考首日现场", "url": "https://s.weibo.com/weibo?q=高考首日现场", "heat": "534万", "platforms": ["weibo", "toutiao"], "trend": "up" },
    { "rank": 2, "title": "全国多地高温预警", "url": "https://example.com/2", "heat": "450万", "platforms": ["weibo", "zhihu"], "trend": "flat" }
  ],
  "sources": [
    {
      "source": "weibo",
      "name": "微博",
      "listName": "热搜榜",
      "status": "ok",
      "updatedAt": "2026-06-05T10:29:45Z",
      "items": [
        { "rank": 1, "title": "高考首日现场", "heat": "534万", "url": "https://s.weibo.com/weibo?q=高考首日现场", "tags": [] }
      ]
    }
  ]
}
```

**注意**：`ranking` 为基础聚合结果，不依赖 AI 可用性，即使 AI 不可用也能返回综合热榜。AI 不可用时仅影响 `featured`（今日最热、热点速览）和 `recommendations`（个性推荐）。`tags` 为空数组时前端标签筛选自然不可用。

## 核心流程

### 1. 页面加载

1. 用户打开页面 → React 渲染侧边栏 + 默认首页视图（骨架屏）
2. `useHotData` Hook 请求 `GET /api/hot`
3. **首屏优先展示基础数据**：`ranking`（综合热榜）和 `sources`（平台数据）不依赖 AI，优先渲染；`ai.featured` 和 `ai.recommendations` 为 AI 依赖区域，允许异步补齐或降级显示占位
4. 数据返回后填充三个视图：
   - 首页：`ai.featured`（section=featured）→ 今日最热轮播；`ai.featured`（section=quick）→ 热点速览；`ranking`（顶层）→ 综合热榜
   - 个性推荐：`ai.recommendations` → 大卡片列表
   - 平台：`sources` → 平台卡片网格

### 2. 后端数据刷新

```
每 5~10 分钟定时任务（或请求触发 + 缓存 TTL）：
1. 并发 fetch 8+1 个平台 JSON 接口（8 核心 + 抖音可降级）
2. 各 service 解析为统一 HotItem[] 格式
3. 基础聚合：对成功平台的数据去重 + 按热度排序 → 生成 ranking[]（不依赖 AI）
4. AI 增强：成功的平台数据批量送 DeepSeek V3.2：
   - Prompt 包含所有热搜标题 + 排名 + 热度
   - 返回：事件聚类、热门原因、分类标签、个性推荐
5. AI 结果 + ranking + 平台数据 写入内存缓存
6. 单平台失败 → 该平台 status=error，不影响其他
7. AI 失败 → ai.available=false，ranking + 基础热搜正常返回
```

### 3. AI 调用细节

- 输入：所有平台热搜标题（约 50~80 条，约 2000~3000 token）
- 输出：结构化 JSON（事件聚类 + 标签 + 推荐 + 排名）
- 超时：10 秒硬超时，超时则跳过
- 校验：后端解析 AI 返回的 JSON，过滤非法标签（不在固定 10 类枚举中的）、截断超长文本
- 成本：约 15~25 元/月（每 10 分钟调用一次，90% 缓存命中）

### 4. 视图切换

- 纯前端行为，不重新请求接口
- 点击侧边栏导航项 → `useState` 切换当前视图 → 对应组件渲染
- 侧边栏热门标签点击 → 切换至个性推荐视图 + 自动设置筛选标签

### 5. 刷新

- 用户点击刷新按钮 → 重新请求 `GET /api/hot`（走后端缓存，不强制绕过）
- 成功：更新 state + Toast "数据已更新"
- 失败：保留旧数据 + Toast "刷新失败，显示的是之前的数据"

## 开发环境代理

- Vite `vite.config.ts` 将 `/api` 代理到 `http://localhost:3001`
- 生产环境：`VITE_API_BASE` 环境变量指向后端域名，或 Nginx 反向代理

## 缓存策略

| 缓存对象 | TTL | Key | 说明 |
|---------|-----|-----|------|
| 单平台数据 | 5~10 分钟 | `hot:{source}` | 各平台独立，失败不影响其他 |
| AI 结果 | 5~10 分钟 | `ai:result` | 与热搜数据同步刷新 |
| 聚合响应 | 5~10 分钟 | `hot:all` | 完整 `/api/hot` 响应 |

- 首屏可先返回命中的基础热榜缓存（ranking + sources），AI 数据为空或延迟补齐时前端展示降级态
- 缓存过期 + 新抓取失败 → 返回过期数据 + 标注「数据可能已过期」
- 开发环境支持 `?refresh=1` 查询参数强制跳过缓存

## 降级策略

| 场景 | 降级行为 |
|------|---------|
| 单平台抓取失败 | 该平台 `status=error`，前端卡片显示错误态 + 重试按钮，其他平台正常 |
| 抖音接入失败 | 可降级平台，隐藏卡片或显示「数据源维护中」 |
| AI 服务超时（>10s） | `ai.available=false`，`featured`/`recommendations` 为空，前端今日最热/热点速览/个性推荐降级隐藏；`ranking` 不受影响，综合热榜和平台视图正常 |
| AI 返回格式异常 | 后端 JSON 解析失败时丢弃，等同 AI 不可用 |
| 后端整体不可用 | 前端显示全局错误页 |

## 数据方案备注

- **主路线**：自建 Express 后端，fetch 各平台 JSON 接口（0 元基础设施成本）
- **抓取参考**：DailyHotApi（MIT 开源，3.6k stars）的请求头和解析逻辑
- **高难度平台**：抖音优先尝试自研签名，失败则接入第三方 API（如 TikHub）或降级
- **不推荐**：微博 OAuth、HTML 全页爬虫（维护成本高、反爬风险大）
- **AI 备选**：若 DeepSeek 不可用，可切换 Qwen3 32B（Groq 托管，$0.08/M token 输入）
