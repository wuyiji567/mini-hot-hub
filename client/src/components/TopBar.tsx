import { useEffect, useState } from "react";
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

/** 当前时间 HH:MM */
function formatClock(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function TopBar({
  title,
  subtitle,
  updatedAt,
  refreshing,
  onRefresh,
  onToggleSidebar,
}: TopBarProps) {
  // 每秒更新一次「当前时间」；相对更新时间也随之重算，避免缓存期内文案失真
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className={styles.topbar}>
      <button className={styles.hamburger} onClick={onToggleSidebar} aria-label="展开导航">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{title}</h1>
        <span className={styles.subtitle}>{subtitle}</span>
      </div>

      <div className={styles.right}>
        {/* 时间方案 C：当前时间为主 + 更新于小字状态 */}
        <div className={styles.datetime}>
          <span className={styles.clock}>{formatClock(now)}</span>
          {updatedAt && <span className={styles.updated}>{formatRelative(updatedAt)}</span>}
        </div>

        <button
          className={styles.refreshBtn}
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="刷新"
        >
          <svg
            className={refreshing ? styles.spinning : ""}
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          {refreshing ? "刷新中" : "刷新"}
        </button>
      </div>
    </header>
  );
}
