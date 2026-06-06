import styles from "./HotItem.module.css";
import TagBadge from "./TagBadge";
import type { HotItem as HotItemType } from "../types";

interface HotItemProps {
  item: HotItemType;
}

/** 单条平台热搜：排名 + 标题（可点击跳转）+ 标签 + 热度 */
export default function HotItem({ item }: HotItemProps) {
  const rankClass =
    item.rank === 1
      ? styles.rank1
      : item.rank === 2
        ? styles.rank2
        : item.rank === 3
          ? styles.rank3
          : styles.rankNormal;

  return (
    <li className={styles.item}>
      <span className={`${styles.rank} ${rankClass}`}>{item.rank}</span>

      <div className={styles.body}>
        {item.url ? (
          <a className={styles.title} href={item.url} target="_blank" rel="noopener noreferrer">
            {item.title}
          </a>
        ) : (
          <span className={styles.title}>{item.title}</span>
        )}
        {item.tags.length > 0 && (
          <span className={styles.tags}>
            {item.tags.slice(0, 2).map((tag) => (
              <TagBadge key={tag} label={tag} />
            ))}
          </span>
        )}
      </div>

      {item.heat && <span className={styles.heat}>{item.heat}</span>}
    </li>
  );
}
