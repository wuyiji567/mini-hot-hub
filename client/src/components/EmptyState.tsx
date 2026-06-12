import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message = "暂无数据" }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      {/* 线性空盒图标 + 柔和圆底，与维护态共用一套中性状态语言（riso） */}
      <span className={styles.icon} aria-hidden="true">
        <svg
          width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M22 12h-6l-2 3h-4l-2-3H2" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      </span>
      <span>{message}</span>
    </div>
  );
}
