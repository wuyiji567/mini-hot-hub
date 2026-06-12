import styles from "./HomeView.module.css";
import RankingList from "../RankingList";
import Loading from "../Loading";
import type { AIFeatured, HotResponse, Source } from "../../types";

interface HomeViewProps {
  data: HotResponse | null;
  loading: boolean;
}

// 平台标识 → 中文简称（来源小标签展示用）
const PLATFORM_NAMES: Record<string, string> = {
  weibo: "微博",
  zhihu: "知乎",
  bilibili: "B站",
  github: "GitHub",
  thepaper: "澎湃",
  kr36: "36氪",
  hupu: "虎扑",
  toutiao: "头条",
  douyin: "抖音",
};

// 分类（取「·」前主类）→ CSS 标签色变量名
const CATEGORY_VAR: Record<string, string> = {
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

function tagColorVars(tag: string): React.CSSProperties {
  const main = (tag || "").split("·")[0]?.trim();
  const key = CATEGORY_VAR[main ?? ""] ?? "other";
  return {
    color: `var(--tag-${key})`,
    background: `var(--tag-${key}-bg)`,
  };
}

/** AI 卡片（今日最热 / 热点速览共用，size 控制大小） */
function FeaturedCard({ item, size }: { item: AIFeatured; size: "big" | "small" }) {
  return (
    <article className={`${styles.card} ${size === "big" ? styles.cardBig : styles.cardSmall}`}>
      <div className={styles.cardHead}>
        {item.tag && (
          <span className={styles.tag} style={tagColorVars(item.tag)}>
            {item.tag}
          </span>
        )}
        {item.trend && <span className={styles.trend}>{item.trend}</span>}
      </div>

      <h3 className={styles.cardTitle}>{item.eventTitle}</h3>

      {item.hotReason && (
        <p className={styles.reason}>
          <span className={styles.reasonLabel}>AI 热门原因</span>
          {item.hotReason}
        </p>
      )}

      <div className={styles.meta}>
        {item.heat && <span className={styles.heat}>{item.heat}</span>}
        {item.platforms.length > 0 && (
          <span className={styles.platforms}>
            {item.platforms.map((p: { source: Source; rank: number }) => (
              <span
                key={p.source}
                className={styles.platformPill}
                style={{ background: `var(--platform-${p.source})` }}
              >
                {PLATFORM_NAMES[p.source] ?? p.source}
                <span className={styles.platformRank}>#{p.rank}</span>
              </span>
            ))}
          </span>
        )}
      </div>
    </article>
  );
}

/**
 * 首页视图：
 * - 今日最热（featured）/ 热点速览（quick）：AI ready 且有数据时展示真实内容，否则降级占位
 * - 综合热榜：始终展示
 */
export default function HomeView({ data, loading }: HomeViewProps) {
  if (loading && !data) {
    return <Loading message="正在加载热榜数据…" />;
  }

  const ai = data?.ai;
  const aiReady = ai?.available === true && ai.status === "ready";
  const featured = aiReady ? ai.featured.filter((f) => f.section === "featured") : [];
  const quick = aiReady ? ai.featured.filter((f) => f.section === "quick") : [];

  // AI 不可用时的占位文案（按状态区分）
  const placeholderText =
    ai?.status === "pending"
      ? "AI 内容生成中，请稍候…"
      : "AI 推荐暂时不可用，请查看下方综合热榜。";

  return (
    <div className={styles.view}>
      {/* 今日最热 */}
      <section>
        <h2 className={styles.sectionTitle}>
          今日最热
          <span className={styles.sectionHint}>AI 精选 · 最值得关注</span>
        </h2>
        {featured.length > 0 ? (
          <div className={styles.featuredGrid}>
            {featured.map((item, i) => (
              <FeaturedCard key={`f-${i}`} item={item} size="big" />
            ))}
          </div>
        ) : (
          <div className={styles.aiPlaceholder}>
            <div className={styles.placeholderTag}>今日最热</div>
            <p>{placeholderText}</p>
          </div>
        )}
      </section>

      {/* 热点速览 */}
      <section>
        <h2 className={styles.sectionTitle}>
          热点速览
          <span className={styles.sectionHint}>AI 速览 · 次级热点</span>
        </h2>
        {quick.length > 0 ? (
          <div className={styles.quickGrid}>
            {quick.map((item, i) => (
              <FeaturedCard key={`q-${i}`} item={item} size="small" />
            ))}
          </div>
        ) : (
          <div className={styles.aiPlaceholder}>
            <div className={styles.placeholderTag}>热点速览</div>
            <p>{placeholderText}</p>
          </div>
        )}
      </section>

      {/* 综合热榜 —— 始终展示 */}
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
