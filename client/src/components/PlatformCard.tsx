import styles from "./PlatformCard.module.css";
import HotItem from "./HotItem";
import EmptyState from "./EmptyState";
import ErrorCard from "./ErrorCard";
import type { HotItem as HotItemType, HotPlatform } from "../types";

interface PlatformCardProps {
  platform: HotPlatform;
  items?: HotItemType[]; // 经标签筛选后的展示条目（缺省用 platform.items）
  emptyMessage?: string; // 无条目时的空状态文案
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
export default function PlatformCard({
  platform,
  items,
  emptyMessage = "暂无数据",
  onRetry,
}: PlatformCardProps) {
  const displayItems = items ?? platform.items;
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <span className={styles.icon} style={{ background: `var(--platform-${platform.source})` }}>
          {platform.name.slice(0, 1)}
        </span>
        {/* 名称 / 榜单名纵向堆叠，层级更清晰 */}
        <span className={styles.titleGroup}>
          <span className={styles.name}>{platform.name}</span>
          <span className={styles.listName}>{platform.listName}</span>
        </span>
        {/* 降级态：头部右侧轻量「维护中」徽章（非崩溃） */}
        {platform.status === "error" && <span className={styles.statusBadge}>维护中</span>}
      </header>

      <div className={styles.bodyWrap}>
        {platform.status === "error" ? (
          <ErrorCard
            variant="maintenance"
            message={platform.errorMessage ?? "数据源暂时不可用"}
            onRetry={onRetry}
          />
        ) : displayItems.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <ul className={styles.list}>
            {displayItems.slice(0, 20).map((item) => (
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
