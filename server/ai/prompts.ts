// Prompt 模板。输入只用 HotItem 的精简字段（平台/排名/标题），不把原始响应整个塞给 AI。

import type { ChatMessage } from "./deepseek.js";
import { TAG_ENUM } from "./parser.js";

/** 喂给 AI 的精简条目（不含 url/heat 等冗余字段，省 token） */
export interface SlimItem {
  platform: string;
  rank: number;
  title: string;
}

const TAG_LIST = TAG_ENUM.join("、");

/** 从精简条目列表生成紧凑文本，控制行数避免超长（归纳类 prompt 输入越大、推理越慢） */
function renderItems(items: SlimItem[], limit = 36): string {
  return items
    .slice(0, limit)
    .map((it) => `${it.platform}#${it.rank} ${it.title}`)
    .join("\n");
}

/** C1：分类标签 —— 给每条热搜打 1~2 个固定枚举标签 */
export function buildTagPrompt(items: SlimItem[]): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        `你是中文热搜内容分类助手。只能使用以下固定标签：${TAG_LIST}。` +
        `每条最多 2 个标签，无法判断时用「其他」。只输出 JSON。`,
    },
    {
      role: "user",
      content:
        `给下面每条热搜分类，输出 JSON：{"results":[{"index":0,"tags":["科技"]}, ...]}，` +
        `index 为条目序号（从 0 开始），tags 来自固定枚举、最多 2 个。\n\n` +
        items.map((it, i) => `${i}. ${it.title}`).join("\n"),
    },
  ];
}

/** C2：今日最热 + 热点速览 —— 归纳事件、给热门原因 */
export function buildFeaturedPrompt(items: SlimItem[]): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        `你是中文热点编辑。从多平台热搜中归纳值得关注的事件，解释为什么热（须引用可解释依据，` +
        `如「多平台同时登榜」「热度飙升」）。标签只能用：${TAG_LIST}。只输出 JSON。`,
    },
    {
      role: "user",
      content:
        `基于以下多平台热搜（每行格式「平台#排名 标题」），输出 JSON：\n` +
        `{"featured":[{"eventTitle":"","hotReason":"","tag":"科技 · AI","heat":"","trend":"",` +
        `"platforms":[{"source":"weibo","rank":1}],"section":"featured"}],` +
        `"quick":[{"eventTitle":"","hotReason":"","tag":"","heat":"","trend":"",` +
        `"platforms":[{"source":"zhihu","rank":2}],"section":"quick"}]}\n` +
        `featured 5 条（最值得关注），quick 8~10 条（次级热点，不与 featured 重复）。\n` +
        `platforms 必须取自下方真实出现的「平台#排名」，source 用平台标识、rank 用对应数字，` +
        `每条至少 1 个来源平台。\n\n` +
        renderItems(items),
    },
  ];
}

/** C3：个性推荐 —— 基于预设兴趣标签 + 相似主题 */
export function buildRecommendPrompt(items: SlimItem[], interests: string[]): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        `你是中文个性化推荐助手。基于用户关注标签和热搜相似主题生成推荐，` +
        `并说明推荐理由。标签只能用：${TAG_LIST}。只输出 JSON。`,
    },
    {
      role: "user",
      content:
        `用户关注标签：${interests.join("、")}。\n` +
        `基于以下热搜生成推荐，输出 JSON：\n` +
        `{"recommendations":[{"eventTitle":"","reasonType":"follow","reasonLabel":"你关注 · 科技",` +
        `"aiReason":"","platform":"weibo","platformCount":1,"heat":"","tags":["科技"]}]}\n` +
        `reasonType：follow=匹配关注标签，similar=相似主题。生成 6~8 条。\n\n` +
        renderItems(items),
    },
  ];
}
