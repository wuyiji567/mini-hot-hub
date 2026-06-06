import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message = "暂无数据" }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <span className={styles.icon}>🗂️</span>
      <span>{message}</span>
    </div>
  );
}
