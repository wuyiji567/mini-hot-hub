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
  // 文字向弱灰混色去饱和、背景降到 ~7% 透明：比直接用 --tag-*(满色)/--tag-*-bg(0.1) 更淡，
  // 不像主按钮。color-mix 不支持时整条属性回退（文字继承、无底色），仍可读。
  return (
    <span
      className={styles.badge}
      style={{
        color: `color-mix(in srgb, var(--tag-${key}) 62%, var(--color-text-dim))`,
        background: `color-mix(in srgb, var(--tag-${key}) 7%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}
