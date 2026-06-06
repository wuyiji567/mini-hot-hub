import styles from "./PlatformView.module.css";
import PlatformCard from "../PlatformCard";
import EmptyState from "../EmptyState";
import type { HotResponse } from "../../types";

interface PlatformViewProps {
  data: HotResponse | null;
  loading: boolean;
}

/** 平台视图：各平台卡片网格（第一阶段 4 个平台） */
export default function PlatformView({ data, loading }: PlatformViewProps) {
  if (loading && !data) {
    return <div className={styles.skeleton}>正在加载平台数据…</div>;
  }

  const sources = data?.sources ?? [];

  if (sources.length === 0) {
    return <EmptyState message="暂无平台数据" />;
  }

  return (
    <div className={styles.grid}>
      {sources.map((platform) => (
        <PlatformCard key={platform.source} platform={platform} />
      ))}
    </div>
  );
}
