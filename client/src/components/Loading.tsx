import styles from "./Loading.module.css";

interface LoadingProps {
  message?: string;
}

/** 首屏 / 区块加载态：旋转指示器 + 文案，避免空白 */
export default function Loading({ message = "正在加载…" }: LoadingProps) {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.spinner} />
      <span className={styles.text}>{message}</span>
    </div>
  );
}
