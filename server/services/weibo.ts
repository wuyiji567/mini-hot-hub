// 微博 service —— 第一阶段返回 mock，不接真实上游。
// 第二阶段把 fetchWeibo 内部换成真实抓取 + 解析为 HotItem[] 即可，对外签名不变。

import type { HotItem } from "../types/index.js";

const MOCK_ITEMS: HotItem[] = [
  { rank: 1, title: "国产大模型发布会引热议", url: "https://s.weibo.com/weibo?q=国产大模型", heat: "986万", tags: [] },
  { rank: 2, title: "高考首日各地启动交通管制", url: "https://s.weibo.com/weibo?q=高考首日", heat: "812万", tags: [] },
  { rank: 3, title: "某顶流演唱会门票秒空", url: "https://s.weibo.com/weibo?q=演唱会门票", heat: "734万", tags: [] },
  { rank: 4, title: "夏季高温预警覆盖多省", url: "https://s.weibo.com/weibo?q=高温预警", heat: "601万", tags: [] },
  { rank: 5, title: "新能源车企公布销量榜", url: "https://s.weibo.com/weibo?q=新能源销量", heat: "542万", tags: [] },
  { rank: 6, title: "网友热议远程办公新政策", url: "https://s.weibo.com/weibo?q=远程办公", heat: "498万", tags: [] },
  { rank: 7, title: "国家队公布最新大名单", url: "https://s.weibo.com/weibo?q=国家队名单", heat: "455万", tags: [] },
  { rank: 8, title: "某影视剧大结局上热搜", url: "https://s.weibo.com/weibo?q=大结局", heat: "421万", tags: [] },
  { rank: 9, title: "城市夜经济迎来复苏", url: "https://s.weibo.com/weibo?q=夜经济", heat: "389万", tags: [] },
  { rank: 10, title: "高校公布今年招生计划", url: "https://s.weibo.com/weibo?q=招生计划", heat: "356万", tags: [] },
  { rank: 11, title: "多地启动消费券发放", url: "https://s.weibo.com/weibo?q=消费券", heat: "312万", tags: [] },
  { rank: 12, title: "一线城市房租出现回落", url: "https://s.weibo.com/weibo?q=房租回落", heat: "287万", tags: [] },
];

export async function fetchWeibo(): Promise<HotItem[]> {
  return MOCK_ITEMS;
}
