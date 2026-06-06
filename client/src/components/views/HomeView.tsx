import styles from "./HomeView.module.css";
import RankingList from "../RankingList";
import type { HotResponse } from "../../types";

interface HomeViewProps {
  data: HotResponse | null;
  loading: boolean;
}

/**
 * 首页视图（MVP 第一阶段）：
 * - 今日最热 / 热点速览：保留入口，显示轻量占位（不伪造 AI 内容）
 * - 综合热榜：真实展示（基于聚合算法的 mock 数据）
 */
export default function HomeView({ data, loading }: HomeViewProps) {
  if (loading && !data) {
    return <div className={styles.skeleton}>正在加载热榜数据…</div>;
  }

  return (
    <div className={styles.view}>
      {/* 今日最热 —— 第一阶段占位 */}
      <section className={styles.aiPlaceholder}>
        <div className={styles.placeholderTag}>今日最热</div>
        <p>AI 精选事件将在第二阶段接入，敬请期待。</p>
      </section>

      {/* 热点速览 —— 第一阶段占位 */}
      <section className={styles.aiPlaceholder}>
        <div className={styles.placeholderTag}>热点速览</div>
        <p>AI 速览卡片将在第二阶段接入。</p>
      </section>

      {/* 综合热榜 —— 第一阶段核心内容 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          综合热榜
          <span className={styles.sectionHint}>全平台聚合排名 Top 20</span>
        </h2>
        <RankingList items={data?.ranking ?? []} />
      </section>
    </div>
  );
}
