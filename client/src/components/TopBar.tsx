import styles from "./TopBar.module.css";

interface TopBarProps {
  title: string;
  subtitle: string;
  updatedAt: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  onToggleSidebar: () => void;
}

/** 计算「更新于 x 分钟前」相对时间 */
function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMin = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (diffMin < 1) return "刚刚更新";
  if (diffMin < 60) return `更新于 ${diffMin} 分钟前`;
  const diffHour = Math.round(diffMin / 60);
  return `更新于 ${diffHour} 小时前`;
}

export default function TopBar({
  title,
  subtitle,
  updatedAt,
  refreshing,
  onRefresh,
  onToggleSidebar,
}: TopBarProps) {
  return (
    <header className={styles.topbar}>
      <button className={styles.hamburger} onClick={onToggleSidebar} aria-label="展开导航">
        ☰
      </button>

      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{title}</h1>
        <span className={styles.subtitle}>{subtitle}</span>
      </div>

      <div className={styles.right}>
        {updatedAt && <span className={styles.updated}>{formatRelative(updatedAt)}</span>}
        <button
          className={styles.refreshBtn}
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="刷新"
        >
          <span className={refreshing ? styles.spinning : ""}>⟳</span>
          {refreshing ? "刷新中" : "刷新"}
        </button>
      </div>
    </header>
  );
}
