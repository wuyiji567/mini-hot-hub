import styles from "./TagBadge.module.css";

// 固定标签（取「·」前主类）→ riso 标签色变量名
const TAG_KEY: Record<string, string> = {
  科技: "tech",
  娱乐: "entertainment",
  体育: "sports",
  财经: "finance",
  社会: "society",
  游戏: "gaming",
  教育: "education",
  汽车: "auto",
  国际: "international",
  生活: "life",
  其他: "other",
};

interface TagBadgeProps {
  label: string;
}

export default function TagBadge({ label }: TagBadgeProps) {
  const main = (label || "").split("·")[0]?.trim();
  const key = TAG_KEY[main ?? ""] ?? "other";
  return (
    <span
      className={styles.badge}
      style={{ color: `var(--tag-${key})`, background: `var(--tag-${key}-bg)` }}
    >
      {label}
    </span>
  );
}
