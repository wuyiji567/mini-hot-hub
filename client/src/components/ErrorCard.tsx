import styles from "./ErrorCard.module.css";

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
  // "error"：真实加载失败（默认）；"maintenance"：单平台降级，作维护中态展示，不像崩溃
  variant?: "error" | "maintenance";
}

/** 单平台 / 全局错误态 + 重试按钮 */
export default function ErrorCard({ message, onRetry, variant = "error" }: ErrorCardProps) {
  const isMaintenance = variant === "maintenance";
  return (
    <div className={`${styles.card} ${isMaintenance ? styles.maintenance : ""}`}>
      <span className={styles.icon} aria-hidden="true">
        {isMaintenance ? (
          /* 维护扳手图标（线性，非告警三角） */
          <svg
            width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M14.7 6.3a4 4 0 0 0-5.4 5.3L3 18l3 3 6.4-6.3a4 4 0 0 0 5.3-5.4l-2.4 2.4-2.6-.7-.7-2.6z" />
          </svg>
        ) : (
          "⚠️"
        )}
      </span>
      <p className={styles.message}>{isMaintenance ? `数据源维护中 · ${message}` : message}</p>
      {onRetry && (
        <button className={styles.retry} onClick={onRetry}>
          {isMaintenance ? "重新加载" : "重试"}
        </button>
      )}
    </div>
  );
}
