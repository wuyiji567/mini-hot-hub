// B站 service —— 第一阶段返回 mock。

import type { HotItem } from "../types/index.js";

const MOCK_ITEMS: HotItem[] = [
  { rank: 1, title: "【硬核】国产大模型实测对比", url: "https://www.bilibili.com/video/BV1001", heat: "523万", tags: [] },
  { rank: 2, title: "毕业季 vlog 合集", url: "https://www.bilibili.com/video/BV1002", heat: "467万", tags: [] },
  { rank: 3, title: "新能源车深度测评", url: "https://www.bilibili.com/video/BV1003", heat: "412万", tags: [] },
  { rank: 4, title: "复刻米其林大餐", url: "https://www.bilibili.com/video/BV1004", heat: "389万", tags: [] },
  { rank: 5, title: "高考加油混剪", url: "https://www.bilibili.com/video/BV1005", heat: "367万", tags: [] },
  { rank: 6, title: "程序员的一天", url: "https://www.bilibili.com/video/BV1006", heat: "334万", tags: [] },
  { rank: 7, title: "露营装备开箱", url: "https://www.bilibili.com/video/BV1007", heat: "312万", tags: [] },
  { rank: 8, title: "国家队比赛精彩集锦", url: "https://www.bilibili.com/video/BV1008", heat: "298万", tags: [] },
  { rank: 9, title: "AI 绘画教程", url: "https://www.bilibili.com/video/BV1009", heat: "276万", tags: [] },
  { rank: 10, title: "城市夜骑路线推荐", url: "https://www.bilibili.com/video/BV1010", heat: "254万", tags: [] },
  { rank: 11, title: "高校宿舍改造大赏", url: "https://www.bilibili.com/video/BV1011", heat: "231万", tags: [] },
];

export async function fetchBilibili(): Promise<HotItem[]> {
  return MOCK_ITEMS;
}
