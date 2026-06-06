// 知乎 service —— 第一阶段返回 mock。

import type { HotItem } from "../types/index.js";

const MOCK_ITEMS: HotItem[] = [
  { rank: 1, title: "如何看待国产大模型发布会？", url: "https://www.zhihu.com/question/100001", heat: "421万", tags: [] },
  { rank: 2, title: "高考志愿填报有哪些避坑技巧？", url: "https://www.zhihu.com/question/100002", heat: "398万", tags: [] },
  { rank: 3, title: "新能源车现在值得入手吗？", url: "https://www.zhihu.com/question/100003", heat: "356万", tags: [] },
  { rank: 4, title: "远程办公会成为未来主流吗？", url: "https://www.zhihu.com/question/100004", heat: "334万", tags: [] },
  { rank: 5, title: "如何评价今年的高温天气？", url: "https://www.zhihu.com/question/100005", heat: "301万", tags: [] },
  { rank: 6, title: "程序员 35 岁之后出路在哪？", url: "https://www.zhihu.com/question/100006", heat: "289万", tags: [] },
  { rank: 7, title: "普通人如何应对通货膨胀？", url: "https://www.zhihu.com/question/100007", heat: "256万", tags: [] },
  { rank: 8, title: "为什么年轻人越来越爱露营？", url: "https://www.zhihu.com/question/100008", heat: "234万", tags: [] },
  { rank: 9, title: "AI 会取代哪些岗位？", url: "https://www.zhihu.com/question/100009", heat: "212万", tags: [] },
  { rank: 10, title: "考研和工作如何抉择？", url: "https://www.zhihu.com/question/100010", heat: "198万", tags: [] },
  { rank: 11, title: "如何系统地学习一门编程语言？", url: "https://www.zhihu.com/question/100011", heat: "176万", tags: [] },
];

export async function fetchZhihu(): Promise<HotItem[]> {
  return MOCK_ITEMS;
}
