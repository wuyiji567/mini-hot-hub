import styles from "./PlatformCard.module.css";
import HotItem from "./HotItem";
import EmptyState from "./EmptyState";
import ErrorCard from "./ErrorCard";
import type { HotPlatform } from "../types";

interface PlatformCardProps {
  platform: HotPlatform;
  onRetry?: () => void; // 错误态重试
}

function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  return `${Math.round(diffMin / 60)} 小时前`;
}

/** 单个平台卡片：图标 + 名称 + Top 列表 + 更新时间 */
export default function PlatformCard({ platform, onRetry }: PlatformCardProps) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <span className={styles.icon} style={{ background: `var(--platform-${platform.source})` }}>
          {platform.name.slice(0, 1)}
        </span>
        <span className={styles.name}>
          {platform.name}
          <span className={styles.listName}> · {platform.listName}</span>
        </span>
      </header>

      <div className={styles.bodyWrap}>
        {platform.status === "error" ? (
          <ErrorCard message={platform.errorMessage ?? "数据源暂时不可用"} onRetry={onRetry} />
        ) : platform.items.length === 0 ? (
          <EmptyState message="暂无数据" />
        ) : (
          <ul className={styles.list}>
            {platform.items.slice(0, 20).map((item) => (
              <HotItem key={`${platform.source}-${item.rank}`} item={item} />
            ))}
          </ul>
        )}
      </div>

      {platform.status === "ok" && platform.updatedAt && (
        <footer className={styles.footer}>更新于 {formatRelative(platform.updatedAt)}</footer>
      )}
    </section>
  );
}
