import { useEffect, useState } from "react";
import styles from "./HomeView.module.css";
import RankingList from "../RankingList";
import Loading from "../Loading";
import type { AIFeatured, HotResponse, Source } from "../../types";

interface HomeViewProps {
  data: HotResponse | null;
  loading: boolean;
}

const AUTO_MS = 10000;

// 平台标识 → 中文简称
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

function categoryKey(tag: string): string {
  const main = (tag || "").split("·")[0]?.trim();
  return CATEGORY_VAR[main ?? ""] ?? "other";
}

function tagColorVars(tag: string): React.CSSProperties {
  const key = categoryKey(tag);
  return { color: `var(--tag-${key})`, background: `var(--tag-${key}-bg)` };
}

/**
 * 自动轮播：10s 自动切下一页，hover 暂停；任何手动操作（改 page）会让定时器从当前页重新计时
 * （effect 依赖 page，page 一变即重置 timeout）。crossfade 切换，无方向性回绕问题。
 */
function useAutoCarousel(pageCount: number, intervalMs: number) {
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setPage((p) => (p >= pageCount ? 0 : p));
  }, [pageCount]);

  useEffect(() => {
    if (paused || pageCount <= 1) return;
    const t = setTimeout(() => setPage((p) => (p + 1) % pageCount), intervalMs);
    return () => clearTimeout(t);
  }, [page, paused, pageCount, intervalMs]);

  const go = (i: number) => setPage(((i % pageCount) + pageCount) % pageCount);
  return { page, setPaused, go, next: () => go(page + 1), prev: () => go(page - 1) };
}

/** 桌面 3 / 平板 2 / 手机 1 张每页 */
function usePerPage(): number {
  const get = () => {
    if (typeof window === "undefined") return 3;
    if (window.matchMedia("(max-width: 640px)").matches) return 1;
    if (window.matchMedia("(max-width: 1024px)").matches) return 2;
    return 3;
  };
  const [perPage, setPerPage] = useState(get);
  useEffect(() => {
    const onResize = () => setPerPage(get());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return perPage;
}

function ChevronLeft({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 3 7 12 15 21" />
    </svg>
  );
}
function ChevronRight({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 3 17 12 9 21" />
    </svg>
  );
}

/** 左右切换箭头 + 圆点指示器（共用） */
function Controls({
  pageCount,
  page,
  go,
  next,
  prev,
  unit,
  compact = false,
}: {
  pageCount: number;
  page: number;
  go: (i: number) => void;
  next: () => void;
  prev: () => void;
  unit: string;
  compact?: boolean;
}) {
  if (pageCount <= 1) return null;
  const arrowCls = `${styles.arrow} ${compact ? styles.arrowSm : ""}`;
  const iconSize = compact ? 16 : 18;
  return (
    <>
      <button className={`${arrowCls} ${styles.arrowPrev}`} onClick={prev} aria-label={`上一${unit}`}>
        <ChevronLeft size={iconSize} />
      </button>
      <button className={`${arrowCls} ${styles.arrowNext}`} onClick={next} aria-label={`下一${unit}`}>
        <ChevronRight size={iconSize} />
      </button>
      <div className={styles.dots}>
        {Array.from({ length: pageCount }).map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === page ? styles.dotActive : ""}`}
            onClick={() => go(i)}
            aria-label={`第 ${i + 1} ${unit}`}
          />
        ))}
      </div>
    </>
  );
}

/**
 * 解析卡片图片地址。当前仅透传 AIFeatured.imageUrl（后端给的分类默认图，可能为空串）。
 * 预留扩展位：后续「时事图片 provider」可在此把事件标题/标签映射成更贴切的图片 URL，
 * 本次不实现——保持纯函数、无副作用、不联网。
 */
function resolveImageUrl(item: AIFeatured): string | null {
  const url = (item.imageUrl || "").trim();
  return url ? url : null;
}

/** AI 卡片（今日最热 big / 热点速览 small 共用） */
function FeaturedCard({ item, size }: { item: AIFeatured; size: "big" | "small" }) {
  // 分类渐变铺满背景，让卡片不像空白文字卡；大卡更浓、小卡更淡。
  // color-mix 不支持时整条 background 失效，自动回退到卡片白底（优雅降级）。
  const key = categoryKey(item.tag);
  const mix = size === "big" ? "20%" : "11%";
  const fade = size === "big" ? "70%" : "80%";
  const bgStyle: React.CSSProperties = {
    background: `radial-gradient(130% 120% at 0% 0%, color-mix(in srgb, var(--tag-${key}) ${mix}, var(--color-card)), var(--color-card) ${fade})`,
  };

  // 图片层：有 imageUrl 且未加载失败时叠在渐变之上；加载失败 → 回落分类渐变，不出现破图。
  const imageUrl = resolveImageUrl(item);
  const [imgFailed, setImgFailed] = useState(false);
  // 数据刷新换图后重置失败标记，避免旧失败状态误伤新图。
  useEffect(() => setImgFailed(false), [imageUrl]);
  const hasImage = imageUrl !== null && !imgFailed;

  return (
    <article
      className={`${styles.card} ${size === "big" ? styles.cardBig : styles.cardSmall} ${
        hasImage ? styles.hasImage : ""
      }`}
      style={bgStyle}
    >
      {hasImage && (
        <>
          {/* 图片铺满 + 深色渐变遮罩，保证叠加文字可读 */}
          <img
            className={styles.bgImage}
            src={imageUrl}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
          <span className={styles.bgScrim} aria-hidden="true" />
        </>
      )}
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

/** 今日最热：大卡 crossfade 轮播，一次 1 张 */
function FeaturedCarousel({ items }: { items: AIFeatured[] }) {
  const count = items.length;
  const { page, setPaused, go, next, prev } = useAutoCarousel(count, AUTO_MS);

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={styles.stack}>
        {items.map((it, i) => (
          <div
            key={`f-${i}`}
            className={`${styles.slide} ${i === page ? styles.slideActive : ""}`}
            aria-hidden={i !== page}
          >
            <FeaturedCard item={it} size="big" />
          </div>
        ))}
      </div>
      <Controls pageCount={count} page={page} go={go} next={next} prev={prev} unit="条" />
    </div>
  );
}

/** 热点速览：小卡 crossfade 轮播，每页 2~3 张（响应式），移动端 1 张 */
function QuickCarousel({ items }: { items: AIFeatured[] }) {
  const perPage = usePerPage();
  const pages: AIFeatured[][] = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));
  const pageCount = Math.max(1, pages.length);
  const { page, setPaused, go, next, prev } = useAutoCarousel(pageCount, AUTO_MS);

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={styles.stack}>
        {pages.map((pageItems, pi) => (
          <div
            key={`p-${pi}`}
            className={`${styles.slide} ${pi === page ? styles.slideActive : ""}`}
            aria-hidden={pi !== page}
          >
            <div
              className={styles.quickRow}
              style={{ gridTemplateColumns: `repeat(${perPage}, minmax(0, 1fr))` }}
            >
              {pageItems.map((it, i) => (
                <FeaturedCard key={`q-${pi}-${i}`} item={it} size="small" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <Controls pageCount={pageCount} page={page} go={go} next={next} prev={prev} unit="页" compact />
    </div>
  );
}

/**
 * 首页视图：
 * - 今日最热（featured）大卡 crossfade 轮播 / 热点速览（quick）小卡 crossfade 轮播
 * - AI ready 且有数据时展示，否则降级占位
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
          <FeaturedCarousel items={featured} />
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
          <QuickCarousel items={quick} />
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
