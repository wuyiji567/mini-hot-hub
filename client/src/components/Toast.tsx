import { useEffect } from "react";
import styles from "./Toast.module.css";

interface ToastProps {
  message: string;
  /** 自动消失毫秒数，默认 4000 */
  duration?: number;
  onClose: () => void;
}

/** 轻量 Toast：底部居中浮层，自动消失 */
export default function Toast({ message, duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={styles.toast} role="alert">
      <span className={styles.icon}>⚠️</span>
      <span>{message}</span>
    </div>
  );
}
