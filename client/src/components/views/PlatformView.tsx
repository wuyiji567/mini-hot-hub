import { useState } from "react";
import styles from "./PlatformView.module.css";
import PlatformCard from "../PlatformCard";
import EmptyState from "../EmptyState";
import Loading from "../Loading";
import type { HotResponse } from "../../types";

interface PlatformViewProps {
  data: HotResponse | null;
  loading: boolean;
  onRetry: () => void; // 平台错误态重试（触发全量刷新）
}

// 筛选栏：全部 + 固定 11 类枚举（含「汽车」）
const FILTER_TAGS = [
  "全部",
  "科技",
  "娱乐",
  "体育",
  "财经",
  "社会",
  "游戏",
  "教育",
  "汽车",
  "国际",
  "生活",
  "其他",
];

/** 平台视图：标签筛选栏 + 各平台卡片网格 */
export default function PlatformView({ data, loading, onRetry }: PlatformViewProps) {
  const [activeTag, setActiveTag] = useState<string>("全部");

  if (loading && !data) {
    return <Loading message="正在加载平台数据…" />;
  }

  const sources = data?.sources ?? [];

  if (sources.length === 0) {
    return <EmptyState message="暂无平台数据" />;
  }

  const isAll = activeTag === "全部";

  return (
    <div className={styles.view}>
      {/* 标签筛选工具栏 */}
      <div className={styles.filterBar}>
        {FILTER_TAGS.map((t) => (
          <button
            key={t}
            className={`${styles.filterBtn} ${activeTag === t ? styles.filterActive : ""}`}
            onClick={() => setActiveTag(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {sources.map((platform) => {
          // 派生筛选数据，不改动 data 原对象；error 平台不参与过滤
          const filtered = isAll
            ? platform.items
            : platform.items.filter((it) => it.tags.includes(activeTag));
          return (
            <PlatformCard
              key={platform.source}
              platform={platform}
              items={filtered}
              emptyMessage={isAll ? "暂无数据" : "该标签下暂无热搜"}
              onRetry={onRetry}
            />
          );
        })}
      </div>
    </div>
  );
}
