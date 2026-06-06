import styles from "./ErrorCard.module.css";

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
}

/** 单平台 / 全局错误态 + 重试按钮 */
export default function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <div className={styles.card}>
      <span className={styles.icon}>⚠️</span>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button className={styles.retry} onClick={onRetry}>
          重试
        </button>
      )}
    </div>
  );
}
