import styles from "./TagBadge.module.css";

// 固定标签 → 颜色映射（来自 PRD 固定枚举）
const TAG_COLORS: Record<string, string> = {
  科技: "#22d3ee",
  娱乐: "#f472b6",
  体育: "#34d399",
  财经: "#fbbf24",
  社会: "#a78bfa",
  游戏: "#60a5fa",
  教育: "#2dd4bf",
  汽车: "#fb923c",
  国际: "#818cf8",
  生活: "#4ade80",
  其他: "#94a3b8",
};

interface TagBadgeProps {
  label: string;
}

export default function TagBadge({ label }: TagBadgeProps) {
  const color = TAG_COLORS[label] ?? TAG_COLORS["其他"];
  return (
    <span className={styles.badge} style={{ color, borderColor: color }}>
      {label}
    </span>
  );
}
