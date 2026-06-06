
---

### 📋 写在前面



信息时代，你是否也曾有过这样的感受？



随着短视频、社交平台越来越多，我们获取热点信息的途径就越来越分散。每天打开各个app看新闻、看热点、看前沿科技，会消耗我们大量的时间。

那么如果我们可以自己做一个热点信息抓取、各平台头条新闻聚合的应用，一屏扫完微博、知乎、B 站、抖音正在发生什么，毫无疑问，一定会帮我们提速且提效。



**是时候打破"想象力"与"执行力"之间的壁垒了。**



Vibe Coding的出现，让"单兵作战"开发完整应用成为可能。在这个时代，**创意是唯一的上限，AI是你最好的编程伙伴**。



但这并非易事。从一行代码到完整应用，中间隔着巨大的鸿沟：需求如何分析？热榜数据如何获取？前后端如何分工？缓存和部署怎么做？



本期实战手册，不是教你写几个零散的功能片段，而是教你像**产品经理**一样思考，像**开发者**一样工作，利用Vibe Coding工具链，从 0 到 1 完成一个属于你的「今日热搜」——多平台热搜卡片网格、真实数据、可公网访问。

---

### 🧠 【必读】核心认知篇：Vibe Coding 思维



（在开始 Day 1 之前，请先升级你的大脑）



很多人学Vibe Coding，只停留在"让AI写代码"阶段。真正的创作者，必须掌握从想法到产品的**全链路控制权**。



**从想法到产品（Product Thinking）：**

以前你是在写代码，现在你要学的是产品思维。AI不懂"做一个热搜聚合网站"，但它懂"实现一个卡片组件，展示 rank、title、heat、url 四个字段，点击 title 在新标签页打开链接"。



**与AI协作的艺术（AI Collaboration）：**

AI不是魔法，它只是一个非常强大的执行者。你告诉它做什么，它就做什么。如果你自己都不知道要做什么，AI自然也无法帮你做出理想的产品。



**迭代的节奏（Iteration Rhythm）：**

开发不是一次性完成的。你需要理解"小步快跑"，什么时候该添加新功能？什么时候该优化体验？什么时候该修复Bug？

---

### 🗓️ 21 天 Vibe Coding 实战营 · 通关任务表

> **说明**：Day 1～18 为**主路径**（必须完成的核心开发）；Day 19～21 为**缓冲 \+ 部署 \+ 总结**（以部署上线为主，兼修 Bug、补平台、优化体验）。

|阶段|天数|主题|核心产出|
|---|---|---|---|
|基础认知|Day 1\-3|Vibe Coding 入门与工具准备|完成环境搭建，做出第一个网页展示页|
|需求与设计|Day 4\-6|产品需求分析与设计|完成 PRD、技术设计、AGENTS\.md|
|前端开发|Day 7\-11|网页界面与交互开发|三平台卡片网格 \+ Express Mock API|
|后端与数据|Day 12\-15|真实热榜抓取与缓存|微博 / 知乎 / B 站真实数据 \+ 5～10 分钟缓存|
|联调测试|Day 16\-18|全站测试与体验优化<br>|完整可浏览的热榜站（本地可运行）|
|部署上线|Day 19\-21|部署、缓冲修复与分享|线上可访问HTTPS链接|

---



# 第一阶段：基础认知（Day 1\-3）



## Day 1：快速了解 Vibe Coding 生态



### **🎯 学习目标：** 建立 Vibe Coding 的全局认知，了解本期要做的产品形态。



当前 AI 编程已正式进入全民开发时代，Vibe Coding 让没有编程基础的人也能快速开发应用。整体流程呈现出 **从想法 → 设计 → 开发 → 部署** 的完整生态。



### **📚 核心工具链介绍**



**1\. AI 代码编辑器 —— 你的编程伙伴**

|工具|特点|适用场景|
|---|---|---|
|Cursor|专业 AI 代码编辑器，功能强大|中大型项目开发（**本期主力**）|
|Bolt\.new|在线 AI 开发平台，零配置|快速原型、Day 2 体验|
|GitHub Copilot|代码补全神器|辅助编程、提升效率|
|Trae|国产 AI 编辑器，中文友好|国内用户备选|

\-\-\-\-\-\- 本次实战主要用 **Cursor** 写代码，建议阅读官方文档：https://cursor\.com/docs



**2\. AI 大模型 —— 你的智囊团**

|模型|优势|适用场景|
|---|---|---|
|Claude|代码能力强，逻辑清晰|复杂功能开发、解析 JSON|
|GPT|通用能力强，知识丰富|需求分析、方案设计|
|DeepSeek|国产之光，中文优秀|中文项目、文档撰写|
|Gemini|多模态能力强|需要截图对照今日热搜排版时|



**3\. 部署平台 —— 让你的应用上线**

|平台|特点|费用|
|---|---|---|
|Vercel|前端部署首选，自动 CI/CD|免费|
|Railway / Render|适合 Express 后端|有免费档|
|Netlify|功能全面|免费|
|云服务器|完全控制，前后端同机反代|付费|

\-\-\-\-\-\- 本期**不强制**统一部署平台，但手册以 **Vercel（前端）\+ Railway（后端）** 为示例。



**4\. 本期还要用到的**

|工具|用途|
|---|---|
|GitHub|代码托管（**必须**）|
|Node\.js|运行 Express 后端|
|浏览器开发者工具|Network 面板查接口、查 CORS|



### **✅ 今日任务（需连接VPN）**



- 注册核心工具账号：

    - 注册 **Cursor** 账号（https://cursor\.com）

    - 注册 **GitHub** 账号（https://github\.com）

    - 注册 **Vercel** 账号（https://vercel\.com，建议用 GitHub 登录）

- 思考自己的「今日热搜」：

    - 首页有哪些元素？每个平台是一张卡片还是一整页？

    - 你想聚合哪些平台？（手册示例：**微博、知乎、B 站**）

- 网页示例（可参考）：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MjgwOTA2NDc5MGE2NzZlMjU3MGE2OGFjMDZjMjY4MmZfNTBkMjQyOWNhYzhlYjFlODczMzhjNzQyMTE1NWU1NTVfSUQ6NzY0MTQ3Mzg1MDQ0MTkxMTI0NV8xNzgwMzMyNDQxOjE3ODA0MTg4NDFfVjM)

- **打卡要求：**

    - 在知识星球发布学习心得（≥200 字）

    - 包含：你对 Vibe Coding 的理解 \+ 你对自己所做「今日热搜」的期待

---

## Day 2：10 分钟做出你的第一个热榜页



### **🎯 学习目标：** 体验 Vibe Coding 的魔力，先「看见结果」再学工程。



今天，我们将用 Vibe Coding 的方式，在 10 分钟内做出一个**静态热榜展示页**（假数据\-\-\-Mock即可），从对话到页面，可选部署上线！

\-\-\-\-\-\- 重在体验「对话即开发」，**数据是假的没关系**，先建立信心。



**注意：Bolt、扣子等平台都是通过对话就能一键开发的网页，Day2我们先用这种平台看到vibe coding的成果、感受vibe coding的魅力，Day3之后我们用cursor、trae等IDE，或Claude Code、Codex等工具，一步步了解开发过程，实现开发的高度自由化。**



### **🛠️ 实战步骤**



**Step 1：打开 Bolt\.new**

访问 https://bolt\.new ，用 GitHub 账号登录。



**Step 2：和 AI 对话生成代码**

在对话框中输入：

```Markdown
请帮我做一个「今日热搜」的首页，要求：

1. 功能需求：
   - 顶栏显示站点名称「今日热搜」和一句简短介绍
   - 主区域用卡片网格展示 3 个平台：微博热搜、知乎热榜、B站热搜
   - 每个卡片内显示 Top 10 列表，每条包含：排名、标题、热度（可 mock）
   - 标题可点击（链接先用 # 占位）

2. 界面要求：
   - 风格简洁现代，参考「今日头条」的信息密度
   - 网页端 3 列卡片，手机端 1 列卡片
   - 卡片有平台名称、榜单名称、列表

3. 技术要求：
   - 使用 HTML + CSS + JavaScript
   - 数据写在 JS 对象或 JSON 里（Mock 数据）
   - 单文件或少量文件均可
```



**Step 3：迭代优化**

看到初版后，继续和 AI 对话优化：

```Markdown
很好！请做这些调整：
1. 每个平台卡片底部增加「更新于：刚刚（Mock）」
2. 排名 1～3 用不同颜色强调
3. 整页 max-width 限制，居中显示
4. 增加页脚：「本站为学习项目，数据为 Mock」
```



**Step 4：部署上线（可选）**

点击右上角 **Publish**，获得你的第一个线上热榜页链接。



### **✅ 今日任务**





1. 按照步骤完成你的第一个热榜展示页（Mock 数据）

2. 尝试至少 **3 轮**对话迭代优化

3. 可选：部署并获得访问链接

4. **打卡要求：**

    - 分享你的网站链接或本地截图

    - 记录你和 AI 对话的过程（用了哪些提示词）

    - 心得：Vibe Coding 和传统编程有什么不同？Mock 数据为什么有助于先做产品？

---

## Day 3：理解项目开发流程（Day3之后的实战在IDE完成，手册以cursor为例）



### **🎯 学习目标：** 掌握标准 Vibe Coding 开发流程，完成需求调研文档。



做项目不是打开 AI 就开始写代码，而是要遵循一套标准流程。方法和顺序很重要，**先想清楚再动手**，可以让 AI 更准确理解你的意图，减少返工和无效生成。



今天我们来学习这套经过验证的 **5 步工作流**，并为本项目创建 `RESEARCH.md`。

### **📋 5 步开发流程**

```Plaintext
┌─────────────────────────────────────────────────────────┐
│              Vibe Coding 5 步工作流                      │
├──────────┬──────────┬──────────┬────────────┬──────────┤
│ 需求研究 │  PRD文档  │ 技术设计  │ AGENTS.md  │ 开发迭代 │
│ Research │   PRD    │ Tech Doc │  指令文件   │  Build   │
└──────────┴──────────┴──────────┴────────────┴──────────┘
```



**Step 1：需求研究（Research）**

在动手之前，先搞清楚：

- 我到底要做什么？

- 为什么要做？

- 有没有人做过类似的东西？

输出：`RESEARCH.md`



**Step 2：产品需求文档（PRD）**

明确要做哪些功能，不做哪些功能：

- 产品概述

- 目标用户

- 核心功能列表

- 功能优先级（MVP vs 后续版本）

- 界面设计要求

输出：`PRD.md`



**Step 3：技术设计文档（Tech Design）**

确定用什么技术来实现：

- 技术栈选择

- 项目结构

- 数据模型

- 关键技术点

输出：`TECH_DESIGN.md`



**Step 4：AI 代理指令（AGENTS\.md）**

告诉AI在这个项目中应该遵循什么规则：

- 开发规范

- 代码风格

- 测试要求

- 注意事项

输出：`AGENTS.md`



**Step 5：实现和迭代（Build）**

小步快跑，逐步迭代：

1. 生成基础框架

2. 逐步实现核心功能

3. 优化实现细节



### **✅ 今日任务**



- 研究一些类似的成熟产品：

    - 标注、记录你喜欢的布局元素

    - 列出 MVP 必须有的 5 个功能点

    - 列出本期不做的 3 个功能（如：搜索、登录、分类 Tab）



- 创建 `RESEARCH.md`：

```Markdown
# 今日热搜 · 需求研究

## 目标
做一个多平台热搜聚合网站，首页以卡片网格展示微博、知乎、B 站热榜，供他人通过链接访问。

## 调研发现
- 今日热榜首页是多张卡片，每卡对应一个平台榜单
- 每条热榜通常有：排名、标题、链接，部分有热度
- 数据需要后端中转，浏览器无法直接跨域抓取

## 核心需求
1. ≥3 个平台热榜卡片
2. 每条：rank、title、url（可选 heat）
3. 真实数据（非长期 Mock）
4. 后端缓存 5～10 分钟
5. 可部署 HTTPS 公网访问

## 风险与约束
- 上游接口可能变更或限流
- 学习项目，页脚可注明非商用
```

- **打卡要求：**

    - 分享你的 `RESEARCH.md` 内容

    - 思考：为什么需要先写文档再写代码？

---

# 第二阶段：需求与设计（Day 4\-6）



## Day 4：撰写产品需求文档（PRD）



### **🎯 学习目标：** 学会写一份专业的 PRD，作为后续所有 Prompt 的「总纲」。

PRD（Product Requirements Document）是整个项目最重要的文档。一份好的 PRD 可以让 AI 准确理解你的意图，生成高质量的代码。



### **📝 PRD 模板**

```Markdown
# 今日热搜 PRD

## 产品概述
一个多平台热搜聚合网站，首页以卡片网格展示微博、知乎、B 站等平台热榜。
访客打开链接即可浏览，无需登录（登录、用户等权限设定可选）。

## 目标用户
- 想快速扫一眼各平台热点的上班族、学生
- 对 Vibe Coding / 全栈开发感兴趣的学习者

## 核心功能

### MVP（必须做）
1. **首页卡片网格**
   - ≥3 张卡片：微博热搜、知乎热榜、B 站热搜
   - 每张卡片：平台名、榜单名、Top 10～20 列表
   - 每条：排名、标题、跳转链接

2. **数据接口（自建后端）**
   - GET /api/hot/:source（source = weibo | zhihu | bilibili）
   - 可选：GET /api/hot 一次返回全部平台
   - 统一 JSON 格式（见技术设计）

3. **缓存**
   - 每个平台独立缓存，TTL 5～10 分钟
   - 页面展示「更新于 x 分钟前」

4. **异常处理**
   - 单平台失败不影响其他卡片
   - 失败卡片显示友好提示

5. **部署**
   - GitHub 托管代码
   - 公网 HTTPS 可访问

### 后续可以做
- 更多平台（抖音、百度等）
- 分类 Tab（科技/娱乐）
- 站内搜索、历史榜、暗色模式

## 界面设计要求
- 参考今日头条：信息清晰、卡片分区明确
- 桌面多列、手机单列（响应式）
- 页脚：学习项目说明、数据来源、非商用声明

## 技术栈
- 前端：React + TypeScript + Vite + CSS
- 后端：Node.js + Express
- 部署：示例 Vercel + Railway，不强制统一
```

### **✅ 今日任务**

1. 根据模板，写出你的「今日热搜」PRD

2. 用 AI 帮你优化 PRD（把初版发给 AI，让它检查：有没有漏掉异常态、缓存、合规？）

3. **打卡要求：**

    - 分享完整的 PRD 文档

    - 记录 AI 给你的优化建议（≥3 条）

---

## Day 5：技术设计与架构



### **🎯 学习目标：** 学会做技术选型与架构设计，定好前后端契约。

有了 PRD，我们要确定用什么技术来实现这些功能。
技术上的新同学不必有心理压力，不懂的名词（CORS、缓存、JSON）可以整段复制给 AI 让它解释。



### **🏗️ 技术设计文档模板**

```Markdown
# 今日热搜 · 技术设计

## 技术栈
- 前端：React + TypeScript + Vite + CSS（可用 CSS Modules，不强制 UI 库）
- 后端：Node.js + Express
- 数据：各平台 JSON 接口（fetch 解析，非 HTML 爬虫）
- 缓存：内存 Map（TTL 300～600 秒）
- 部署：前端 Vercel / 后端 Railway（示例）

## 项目结构
mini-hot-hub/
├── client/                 # Vite + React
│   ├── src/
│   │   ├── components/     # HotCard、Layout
│   │   ├── api/            # fetchHot
│   │   ├── types/          # HotPlatform、HotItem
│   │   └── mock/           # Mock 阶段数据
├── server/
│   ├── routes/hot.js
│   ├── services/           # weibo.ts、zhihu.ts、bilibili.ts
│   └── utils/cache.js
└── README.md

## 数据模型

### HotItem
- rank: number
- title: string
- heat?: string
- url: string

### HotPlatform（接口响应）
- source: string          // weibo | zhihu | bilibili
- sourceName: string     // 微博
- listName: string        // 热搜榜
- updatedAt: string       // ISO8601
- items: HotItem[]
- error?: boolean
- message?: string

## 核心流程
1. 用户打开首页 → 前端请求 /api/hot
2. 后端查缓存 → 未命中则 fetch 上游 JSON → 解析 → 写入缓存 → 返回
3. 前端按平台渲染 HotCard
4. 某平台失败 → 该卡片 error 态，其他正常

## 开发环境代理
- Vite 将 /api 代理到 http://localhost:3001
- 生产：VITE_API_BASE 指向后端域名，或 Nginx 反代

## 数据方案备注
- 主路线：自建 Express 拉取各平台 JSON（0 元）
- 救急：免费第三方热搜 API（不稳定，仅短期）
- 不推荐：微博 OAuth、HTML 爬虫
```

### **📐 架构示意**

```Plaintext
访客浏览器 → React 前端 → Express /api/hot → 缓存 → fetch 微博/知乎/B站 JSON
```

### **✅ 今日任务**

1. 完成技术设计文档 `TECH_DESIGN.md`

2. 在文档中写清 **接口 JSON 示例**（成功 \+ 失败各一份）

3. **打卡要求：**

    - 分享技术设计文档

    - 附一张你画的架构图（手绘或 AI 生成均可）

    - 用一句话解释：为什么需要后端？

---

## Day 6：创建 AI 开发指令（AGENTS\.md）



### **🎯 学习目标：** 学会给 AI 写「工作手册」，后续所有开发都引用它。

`AGENTS.md` 是给 AI 的开发指令文件，相当于告诉 AI：在这个项目里请遵守哪些规则。



### **📝 AGENTS\.md 模板**

```Markdown
# 今日热搜 · 开发指令

## 项目概述
使用 React + TypeScript + Vite + CSS 开发前端；
使用 Node.js + Express 开发后端，聚合微博/知乎/B 站等热榜。

## 开发规范
- 使用 TypeScript，前后端类型与 TECH_DESIGN 一致
- 使用函数式组件 + Hooks
- 样式使用 CSS / CSS Modules，保持简洁
- 组件可复用：HotCard、HotList、Layout

## 代码风格
- 组件名 PascalCase，函数 camelCase
- 接口路径：/api/hot/:source
- 禁止在前端 fetch 微博/知乎/B 站原始域名

## 设计要求
- 参考今日热榜的信息密度，清爽易读
- 桌面 3 列卡片，移动端 1 列
- 排名 1～3 可视觉强调
- 单卡失败显示错误文案，不拖垮整页

## 注意事项
- 上游请求加合理 User-Agent、Referer（按平台文档）
- 缓存 TTL 默认 600 秒，可用环境变量 CACHE_TTL
- 不要把敏感信息提交到公开 GitHub
- 页脚注明：学习项目、非商用

## 测试要求
- 每完成一个平台，手动验证 ≥10 条数据
- 测试：单平台挂掉时其他平台仍正常
- 测试：10 分钟内重复刷新不会疯狂打上游
```



### **✅ 今日任务**

1. 创建你的 `AGENTS.md` 文件

2. 把 `PRD.md`、`TECH_DESIGN.md`、`AGENTS.md` 三个文件放在项目根目录（或 docs/）

3. **打卡要求：**

    - 分享 `AGENTS.md` 内容

    - 思考：为什么需要给 AI 写指令？和三份文档分别解决什么问题？

---

# 第三阶段：前端开发（Day 7\-11）

> 接下来几天代码量较多，但可以完全依赖 AI 生成和改写。
你主要负责：① 把需求说清楚；② 按步骤验证效果；③ 记录问题并让 AI 排查。
**本阶段目标：Mock 数据跑通全站；后端 Mock API 打通；暂不接真实上游。**



## Day 7：初始化项目与基础框架



### **🎯 学习目标：** 用 AI 初始化 monorepo（client \+ server），跑通前端页面。



### **🛠️ 实战步骤**



**Step 1：打开 Cursor**

创建文件夹 `mini-hot-hub`，在 Cursor 中打开。初始化 Git 并关联 GitHub 远程仓库。



**Step 2：放入三个文档**

将 `PRD.md`、`TECH_DESIGN.md`、`AGENTS.md` 放到项目根目录。



**Step 3：和 AI 对话初始化前端**

```Plaintext
请根据 PRD.md、TECH_DESIGN.md 和 AGENTS.md，
在 client/ 目录初始化 React + TypeScript + Vite 项目。

要求：
1. 使用 CSS（不要引入 Tailwind，除非我后续要求）
2. 创建目录：src/components、src/api、src/types、src/mock
3. 创建 types/hot.ts，定义 HotItem、HotPlatform
4. 创建 mock/hot.json，包含 3 个平台各 10 条 Mock 数据
5. 确保 npm run dev 能启动
```



**Step 4：创建 server 空壳（可选今天或 Day 10）**

```Plaintext
在 server/ 创建 Node.js + Express 最小项目：
- GET /api/health 返回 { ok: true }
- 端口 3001
- 配置 cors 允许 http://localhost:5173
```



**Step 5：验证**

```Bash
cd client && npm run dev
# 另开终端
cd server && npm run dev
```



### **✅ 今日任务**

1. 成功初始化前端（\+ 可选 server 空壳）

2. 项目能正常启动

3. 理解 `client/` 与 `server/` 分工

4. **打卡要求：**

    - 截图项目文件结构

    - 记录初始化过程中的问题与解决过程

---

## Day 8：开发首页卡片网格（Mock 数据）



### **🎯 学习目标：** 完成首页布局与 HotCard 组件，数据来自本地 Mock。



### **🛠️ 实战步骤**



**Step 1：创建 HotCard 组件**

```Plaintext
请创建 HotCard 组件，props 接收 HotPlatform：

要求：
1. 显示平台名 sourceName、榜单名 listName
2. 列表展示 items：rank、title、heat（无则隐藏）
3. title 点击新标签打开 url
4. 底部显示 updatedAt（格式化为「更新于 xx」）
5. 使用 CSS，桌面宽度下卡片等高感
6. 符合 AGENTS.md 设计风格
```



**Step 2：创建首页**

```Plaintext
请创建 Home 页面：

要求：
1. 顶栏：站点名「迷你今日热榜」+ 一句话介绍
2. 主区域：CSS Grid，桌面 3 列，手机 1 列
3. 从 src/mock/hot.json 读取 platforms，map 渲染 HotCard
4. 页脚：学习项目、非商用说明（文案可来自 PRD）
```



**Step 3：优化排名样式**

```Plaintext
请为 rank 1～3 添加不同强调样式，4 及以后使用默认列表样式。
```



### **✅ 今日任务**

1. 完成首页卡片网格（3 平台 Mock）

3. **打卡要求：**

    - 截图首页（本地环境）

    - 分享你对卡片布局的调整

---

## Day 9：加载态、错误态与体验打磨



### **🎯 学习目标：** 为后续真实接口对接预留 UI 状态。



### **🛠️ 实战步骤**



**Step 1：HotCard 三态**

```Plaintext
请为 HotCard 增加三种状态：

1. loading：骨架屏或「加载中...」
2. error：显示 message +「点击重试」按钮（onRetry 回调）
3. success：现有列表

父组件传入 loading、error、data。
```



**Step 2：首页整体 Loading**

```Plaintext
请创建 useHotList hook 或等价逻辑：
- 暂时仍读 mock/hot.json，但用 async 模拟 500ms 延迟
- 首页先显示整体 loading，再显示卡片
```



**Step 3：空状态与页脚**

```Plaintext
若某平台 items 为空且非 error，显示「暂无数据」。
完善页脚合规文案。
```



### **✅ 今日任务**

1. Loading / Error UI 完成

2. 手动测试：改 mock 模拟某平台 `error: true`

3. **打卡要求：**

    - 截图 error 态与 loading 态

    - 心得：为什么真实项目一定要做错误态？

---

## Day 10：搭建 Express 与第一个 Mock API



### **🎯 学习目标：** 后端返回统一 JSON，前端改从 `/api` 取数。



### **🛠️ 实战步骤**



**Step 1：完善 Express**

```Plaintext
在 server/ 实现：

1. GET /api/hot/weibo 返回 Mock 数据（硬编码 10 条，格式符合 TECH_DESIGN）
2. updatedAt 使用 new Date().toISOString()
3. 启动端口 3001，日志打印请求路径
```



**Step 2：配置 Vite 代理**

```Plaintext
请修改 client/vite.config.ts：
将 /api 代理到 http://localhost:3001
并说明生产环境如何处理（VITE_API_BASE）。
```



**Step 3：前端改接 API**

```Plaintext
请创建 client/src/api/hot.ts：
- fetchHotPlatform(source)
- fetchAllHot()  // 若后端有 GET /api/hot

先把微博卡片改为从 /api/hot/weibo 获取，知乎/B 站仍可用 mock 文件。
```



### **✅ 今日任务**

1. 后端 `GET /api/hot/weibo` 可用

2. 前端微博卡片数据来自后端

3. 双终端同时运行联调成功

4. **打卡要求：**

    - 截图 Network 面板中成功的 /api/hot/weibo 请求

    - 记录 CORS 或代理问题（若有）

---

## Day 11：三平台 Mock API 全部打通



### **🎯 学习目标：** 前端三张卡片均从 Express 获取 Mock 数据。



### **🛠️ 实战步骤**



**Step 1：扩展路由**

```Plaintext
请实现：
- GET /api/hot/zhihu  （Mock）
- GET /api/hot/bilibili （Mock）
- GET /api/hot  返回 { platforms: [ ...三个平台 ] }

无效 source 返回 404。
```



**Step 2：前端统一拉取**

```Plaintext
请修改 Home 页面：
- 调用 fetchAllHot() 一次获取全部平台
- 三个 HotCard 均由接口驱动
- 删除对 mock/hot.json 的直接依赖（可保留作备份）
```



**Step 3：README 本地启动说明**

```Plaintext
请更新 README.md：
- 如何安装 client/server 依赖
- 如何同时启动前后端
- 常见问题：端口占用、代理不生效
```



### **✅ 今日任务**

1. 三平台 Mock API 全部完成

2. 首页 100% 来自后端

3. **打卡要求：**

    - 录屏或 GIF：刷新页面，三卡数据正常

    - 粘贴你的 GET /api/hot 响应 JSON（可打码）

---

# 第四阶段：后端与数据（Day 12\-15）

> **主路径核心**：从 Mock 切换到真实数据，并加上缓存。
遇到 403/432/空数据是正常现象，把报错贴给 AI 排查。



## Day 12：实现内存缓存



### **🎯 学习目标：** 5～10 分钟内重复请求走缓存，保护上游。



### **🛠️ 实战步骤**



**Step 1：缓存工具**

```Plaintext
请在 server/utils/cache.js 实现：
- getCache(key) / setCache(key, data, ttlSec)
- 默认 TTL 读环境变量 CACHE_TTL，默认 600
- 过期自动删除
```



**Step 2：接入路由**

```Plaintext
请修改 /api/hot/:source：
- 先查缓存，命中则直接返回并打日志 [cache hit]
- 未命中则生成 Mock（今天仍可用 Mock），写入缓存
- 支持查询参数 ?refresh=1 强制跳过缓存（仅开发用）
```



**Step 3：前端展示更新时间**

```Plaintext
请根据 updatedAt 显示「更新于 3 分钟前」，
并说明缓存期内该时间不变是正常现象。
```



### **✅ 今日任务**

1. 缓存命中可在终端日志看到

2. 连续刷新两次，第二次应 hit（Mock 阶段即可验证）

3. **打卡要求：**

    - 说明你的 TTL 设了多少秒，为什么

    - 截图终端 cache hit 日志

---

## Day 13：接入微博真实热搜



### **🎯 学习目标：** 第一个平台使用真实 JSON 数据。



### **🛠️ 实战步骤**



**Step 1：创建 weibo 服务**

```Plaintext
请创建 server/services/weibo.js：

1. 使用 node 内置 fetch 请求微博热搜相关 JSON 接口
2. 设置移动端 User-Agent 和 Referer
3. 解析为 items: { rank, title, heat, url }[]
4. 捕获异常，抛出清晰错误信息
5. 不要解析 HTML 网页

请在代码注释中说明解析了哪个字段（方便日后接口变更时修改）。
```



**Step 2：接入路由**

```Plaintext
请修改 GET /api/hot/weibo：
- 调用 fetchWeiboHot() 替代 Mock
- 失败时返回 error: true, items: [], message: 友好文案
- 仍走缓存层
```



**Step 3：排查指南**

\-\-\-\-\-\- 若失败：打开 Network / 终端日志，把完整错误贴给 AI；检查请求头；勿高频刷新。

### **✅ 今日任务**

1. 微博卡片展示 **真实** 热搜（≥10 条）

2. 知乎、B 站仍可为 Mock

3. **打卡要求：**

    - 截图真实微博榜单

    - 记录接入过程中的报错与解决（若无报错也写明「一次成功」）

---

## Day 14：接入知乎真实热榜



### **🎯 学习目标：** 第二个平台真实数据上线。



### **🛠️ 实战步骤**



**Step 1：zhihu 服务**

```Plaintext
请参照 weibo.js，创建 server/services/zhihu.js 并接入 /api/hot/zhihu。
返回格式与 TECH_DESIGN 完全一致。
```



**Step 2：并行验证**

```Plaintext
请确保 GET /api/hot 在知乎失败时仍返回微博数据；
失败平台带 error: true，成功平台正常。
```



### **✅ 今日任务**

1. 知乎卡片真实数据

2. 微博 \+ 知乎同时在线

3. **打卡要求：**

    - 截图两卡并排效果

    - 对比两个平台解析代码差异（你自己用一句话总结）

---

## Day 15：接入 B 站真实热搜



### **🎯 学习目标：** 三平台真实数据全部完成，MVP 数据层收官。



### **🛠️ 实战步骤**



**Step 1：bilibili 服务**

```Plaintext
请创建 server/services/bilibili.js 并接入 /api/hot/bilibili。
```



**Step 2：全站检查**

```Plaintext
请检查 GET /api/hot：
- 三平台均真实数据
- 均有 updatedAt
- 缓存独立（一个平台 refresh 不影响其他平台缓存 key）
```



**Step 3：更新 README 数据来源**

```Plaintext
请在 README 增加「数据来源说明」：
- 各平台数据获取方式（JSON 接口）
- 更新频率（缓存 TTL）
- 学习项目免责声明
```



### **✅ 今日任务**

1. 三平台均为真实数据（非 Mock）

2. README 含数据说明

3. **打卡要求：**

    - 全页截图

    - 任选一平台，粘贴 1 条 item 的 JSON 结构

---

# 第五阶段：联调测试（Day 16\-18）

> 本阶段重点：**用访客视角刷一遍网站**，修体验、修 Bug、修文案。



## Day 16：功能测试与 Bug 修复



### **🎯 学习目标：** 学会测试和调试，建立测试清单。



### **📝 测试清单**

* [ ] 首页三卡均显示数据

* [ ] 每条标题可点击跳转

* [ ] 排名、热度显示正确

* [ ] 更新时间文案合理

* [ ] 单平台失败时其他正常

* [ ] 缓存期内 updatedAt 不乱跳

* [ ] 手机宽度布局正常

* [ ] 页脚合规文案存在

* [ ] 硬刷新、软刷新均正常

* [ ] 后端挂掉时前端不白屏



### **🛠️ 实战步骤**

```Plaintext
我遇到了以下问题，请帮我修复：
1. （描述现象）
2. （粘贴报错）
3. （说明复现步骤）

请给出原因 + 修改方案，并告诉我要改哪些文件。
```



### **✅ 今日任务**

1. 完成全面测试，记录 Bug 列表

2. 修复至少 2 个问题（若没有 Bug，优化 2 处体验）

3. **打卡要求：**

    - 分享你的测试清单（可勾选截图）

    - 记录 1 个 Bug 的原因和修复方法

---

## Day 17：容错、降级与合规完善



### **🎯 学习目标：** 上游不稳定时站点仍「能用」，合规文案完整。



### **🛠️ 实战步骤**



**Step 1：手动模拟失败**

```Plaintext
请为开发环境增加 MOCK_FAIL_WEIBO=1 之类的开关，
或临时让 weibo 服务抛错，验证前端 error 卡片展示。
```



**Step 2：重试与刷新**

```Plaintext
请为 HotCard 的「重试」按钮实现：重新请求该平台接口。
全页刷新按钮（可选）：重新请求 /api/hot。
```



**Step 3：合规页脚**

```Plaintext
请完善页脚，包含：
- 本站为个人学习项目
- 数据来源于各平台公开信息，非官方
- 更新频率约 X 分钟（与 CACHE_TTL 一致）
- 如有侵权或违规请联系（可留邮箱占位）
```



### **✅ 今日任务**

1. 至少模拟并验证 1 次单平台失败态

2. 页脚合规文案定稿

3. **打卡要求：**

    - 截图失败态 \+ 恢复后的对比

    - 心得：真实热榜项目和纯展示页有何不同？

---

## Day 18：体验优化与文档收尾（主路径最后一天）



### **🎯 学习目标：** 主路径功能冻结，准备进入部署缓冲期。



### **🛠️ 优化方向（任选 ≥3 项）**

- 手动刷新按钮（提示：仍受缓存限制）

- 相对时间「3 分钟前」

- 卡片 hover、链接 hover 样式

- 整页 Loading 优化

- 站点 favicon、title

- 空 heat 字段隐藏

**Prompt 示例：**

```Plaintext
请优化今日热搜体验：
1. 增加全页刷新按钮，点击重新 fetch /api/hot
2. 使用 formatRelativeTime 显示更新时间
3. 优化移动端卡片间距
4. 确保 npm run build 在 client 下成功
```



### **✅ 今日任务**

1. 完成 ≥3 项体验优化

2. `cd client && npm run build` 成功

3. 整理「部署前检查表」（端口、环境变量、API 地址）

4. **打卡要求：**

    - 列出你做的优化项

    - 截图 `npm run build` 成功

    - 自评：主路径 18 天你最大收获是什么？（≥100 字）

---

# 第六阶段：部署上线（Day 19\-21）

> **Day 19～21 = 3 天缓冲带**：以部署为主，允许修补 Day 16～18 遗留问题、应对上游挂掉、环境变量配错等。



## Day 19：准备部署（缓冲日 1）



### **🎯 学习目标：** 了解部署流程，完成构建与文档。



### **🛠️ 部署前准备**



**前端准备：**

- `cd client && npm run build`

- 检查 `dist/` 是否生成

- 确认 `VITE_API_BASE` 的含义（生产后端地址）

**后端准备：**

- 本地 `node server/index.js` 或 `npm run start` 正常

- 整理环境变量清单：

|变量|说明|
|---|---|
|PORT|后端端口，如 3001|
|CACHE\_TTL|缓存秒数，默认 600|
|CLIENT\_ORIGIN|生产前端域名，用于 CORS|

**🛠️ 可选：整理 monorepo 根 package\.json**

```Plaintext
请在项目根目录添加 scripts：
- dev:client / dev:server 或 concurrently 同时启动
- 说明 Railway 如何从根目录启动 server
```



### **✅ 今日任务**

1. 前端构建成功

2. 写好《部署说明》草稿（可放在 README 的 Deploy 章节）

3. 修复构建报错（若有）

4. **打卡要求：**

    - 截图构建成功

    - 列出部署前检查表（≥5 项）

---

## Day 20：部署上线（缓冲日 2）



### **🎯 学习目标：** 获得公网 HTTPS 链接，他人可访问。



### **🛠️ 部署步骤（示例：Vercel \+ Railway）**



**前端部署（Vercel）：**

1. 代码推送到 GitHub
\-\-\-\-\-\- Git 对网络稳定要求较高，推送失败可尝试手机热点。

2. 打开 Vercel → Add New Project → Import 仓库

3. 关键配置：

    - **Root Directory**：`client`（若前端在子目录）

    - **Framework Preset**：Vite

    - **Build Command**：`npm run build`

    - **Output Directory**：`dist`

4. Deploy，获得 `https://xxx.vercel.app`



**后端部署（Railway 示例）：**

1. 打开 https://railway\.app ，GitHub 登录

2. New Project → Deploy from GitHub repo → 选择仓库

3. 若入口在 `server/`，配置启动命令：`node index.js` 或 `npm start`

4. Variables：`PORT`、`CACHE_TTL`、`CLIENT_ORIGIN`（填 Vercel 域名）

5. Settings → Networking → Generate Domain

6. 记下地址，如 `https://mini-hot-hub-production.up.railway.app`



**提示：railway有自己的agent，如果手动部署遇到困难，可以把github仓库链接丢给agent让它进行自动部署。**



**前后端串联：**

1. Railway 域名填回 Vercel 的 `VITE_API_BASE`:

Environment Variables：`VITE_API_BASE` = 你的railway地址（不要末尾多余斜杠）

2. Vercel **Redeploy** 使环境变量生效

3. 浏览器打开线上站，验证三平台数据



**其他部署方式（不强制）：**

- 单 VPS：Nginx 托管 `dist` \+ 反代 `/api` → Express

- Cloudflare Pages \+ Workers（需自行改写，与 Express 不完全相同）



**Prompt 求助模板：**

```Plaintext
我的项目是 client(Vite React) + server(Express)。
前端在 Vercel，后端在 Railway。
现象：（例如：线上微博有数据，知乎没有 / CORS 报错 / 502）
请根据现象给我排查步骤和要检查的环境变量。
```



### **✅ 今日任务**

1. 前端成功部署到公网

2. 后端成功部署（若微博等依赖后端，则必须部署后端）

3. 获得可分享的 HTTPS 链接

4. **打卡要求：**

    - **分享你的线上链接**

    - 记录部署过程（≥200 字）与踩坑

---

## Day 21：项目总结与分享（缓冲日 3）



### **🎯 学习目标：** 总结 21 天成果，收集反馈，主路径收官。



### **📝 总结内容**



**项目回顾：**

- 你做了什么？（产品一句话）

- 学到了什么？

- 遇到了哪些挑战？（数据、CORS、缓存、部署）

**技能提升：**

- Vibe Coding 思维

- 5 步工作流（Research → PRD → Tech → AGENTS → Build）

- React \+ TypeScript 前端

- Node\.js \+ Express 后端

- 热榜数据获取与缓存

- 部署与排错

**项目自我评分（1～5 分）：**

- 需求文档完整度

- 前端完成度（三卡网格、响应式）

- 后端与数据（真实数据、缓存）

- 部署与线上可用性

- 问题排查与 AI 协作能力

**未来计划：**

- 想加第四平台吗？

- 想做聚合搜索吗？

- 想加用户系统、历史热榜、用户收藏等功能吗？

- 下一次项目你会提前做什么？



### **✅ 今日任务**

1. 撰写项目总结（≥500 字）

2. 把链接发给至少 2 位朋友试用，收集反馈

3. 根据反馈修 1 个小问题（可选，仍在缓冲期内）

4. **打卡要求：**

    - 分享完整项目总结

    - 分享线上链接

    - 分享朋友反馈

---

## 🎉 恭喜你完成 21 天 Vibe Coding 实战！



你已经从零开始，用 Vibe Coding 的方式完成了一个完整的 **「今日热搜」**！

**你学到了什么？**

- **Vibe Coding 思维**：用自然语言和 AI 协作开发完整产品

- **项目开发流程**：从调研、PRD、技术设计到上线

- **前端开发**：React \+ TypeScript \+ Vite \+ CSS，卡片网格与状态管理

- **后端开发**：Node\.js \+ Express，接口聚合与内存缓存

- **数据获取**：多平台 JSON 解析、容错与合规意识

- **项目部署**：Vercel \+ Railway（或其他）公网发布

**下一步？**

- 继续优化：第四平台、暗色模式、历史榜

- 尝试站内搜索（只搜已缓存标题）

- 把本次的 PRD / AGENTS 模板复用到下一个项目

- 分享你的经验，帮助更多星球同学

---

## 💪 加油，未来的 AI 应用开发者！

记住：在 AI 时代，**创造力比语法更重要，清晰的需求比华丽的代码更重要，迭代比一次完美更重要。**

继续创造，继续迭代——下一个你想做的产品，已经从这份热榜开始热身了！

---

