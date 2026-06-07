import styles from "./RankingList.module.css";
import EmptyState from "./EmptyState";
import type { RankingItem } from "../types";

interface RankingListProps {
  items: RankingItem[];
}

const TREND_ICON: Record<RankingItem["trend"], string> = {
  up: "▲",
  down: "▼",
  flat: "—",
};

function RankRow({ item }: { item: RankingItem }) {
  const rankClass =
    item.rank === 1
      ? styles.rank1
      : item.rank === 2
        ? styles.rank2
        : item.rank === 3
          ? styles.rank3
          : styles.rankNormal;

  return (
    <li className={styles.row}>
      <span className={`${styles.rank} ${rankClass}`}>{item.rank}</span>
      {item.url ? (
        <a className={styles.title} href={item.url} target="_blank" rel="noopener noreferrer">
          {item.title}
        </a>
      ) : (
        <span className={styles.title}>{item.title}</span>
      )}
      <span className={styles.platforms}>
        {item.platforms.map((p) => (
          <span key={p} className={styles.dot} title={p} />
        ))}
      </span>
      <span className={`${styles.trend} ${styles[`trend_${item.trend}`]}`}>
        {TREND_ICON[item.trend]}
      </span>
      <span className={styles.heat}>{item.heat}</span>
    </li>
  );
}

/** 综合热榜：两列，左列 1~10、右列 11~20，序号连续不重复 */
export default function RankingList({ items }: RankingListProps) {
  if (items.length === 0) {
    return <EmptyState message="综合热榜暂无数据" />;
  }

  const left = items.slice(0, 10);
  const right = items.slice(10, 20);

  return (
    <div className={styles.columns}>
      <ul className={styles.column}>
        {left.map((item) => (
          <RankRow key={item.rank} item={item} />
        ))}
      </ul>
      {right.length > 0 && (
        <ul className={styles.column}>
          {right.map((item) => (
            <RankRow key={item.rank} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
