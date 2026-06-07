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

/** 平台视图：各平台卡片网格（第一阶段 4 个平台） */
export default function PlatformView({ data, loading, onRetry }: PlatformViewProps) {
  if (loading && !data) {
    return <Loading message="正在加载平台数据…" />;
  }

  const sources = data?.sources ?? [];

  if (sources.length === 0) {
    return <EmptyState message="暂无平台数据" />;
  }

  return (
    <div className={styles.grid}>
      {sources.map((platform) => (
        <PlatformCard key={platform.source} platform={platform} onRetry={onRetry} />
      ))}
    </div>
  );
}
