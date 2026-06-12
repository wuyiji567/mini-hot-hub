import { useEffect, useState } from "react";
import styles from "./InterestView.module.css";
import Loading from "../Loading";
import EmptyState from "../EmptyState";
import type { AIRecommend, HotResponse } from "../../types";

interface InterestViewProps {
  data: HotResponse | null;
  loading: boolean;
  externalTag?: string | null; // 侧边栏热门标签请求的筛选标签
  onConsumeExternalTag?: () => void; // 已消费外部标签的回调（清空 App 状态）
}

const STORAGE_KEY = "mini-hot-hub-interest-tag";

// 筛选栏：全部 + 固定 11 类枚举
const FILTER_TAGS = [
  "全部",
  "科技",
  "娱乐",
  "体育",
  "财经",
  "社会",
  "游戏",
  "教育",
  "汽车",
  "国际",
  "生活",
  "其他",
];

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

// 分类 → CSS 标签色变量名
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
  const key = CATEGORY_VAR[tag] ?? "other";
  return { color: `var(--tag-${key})`, background: `var(--tag-${key}-bg)` };
}

// 取首个分类做卡片渐变铺底（与首页 AI 卡片同款 color-mix 语言；不支持时优雅回退白底）
function cardBgStyle(item: AIRecommend): React.CSSProperties {
  const key = CATEGORY_VAR[item.tags[0] ?? ""] ?? "other";
  return {
    background: `radial-gradient(130% 120% at 0% 0%, color-mix(in srgb, var(--tag-${key}) 12%, var(--color-card)), var(--color-card) 78%)`,
  };
}

function RecommendCard({ item }: { item: AIRecommend }) {
  const follow = item.reasonType === "follow";
  return (
    <article className={styles.card} style={cardBgStyle(item)}>
      <div className={styles.cardHead}>
        <span className={`${styles.reasonTag} ${follow ? styles.follow : styles.similar}`}>
          {item.reasonLabel || (follow ? "你关注" : "相似主题")}
        </span>
        {item.tags.length > 0 && (
          <span className={styles.tags}>
            {item.tags.map((t) => (
              <span key={t} className={styles.tag} style={tagColorVars(t)}>
                {t}
              </span>
            ))}
          </span>
        )}
      </div>

      <h3 className={styles.cardTitle}>{item.eventTitle}</h3>

      {item.aiReason && (
        <p className={styles.reason}>
          <span className={styles.reasonLabel}>AI 推荐理由</span>
          {item.aiReason}
        </p>
      )}

      <div className={styles.meta}>
        {item.heat && <span className={styles.heat}>{item.heat}</span>}
        {item.platform && (
          <span className={styles.platform}>
            <span
              className={styles.platformDot}
              style={{ background: `var(--platform-${item.platform})` }}
            />
            {PLATFORM_NAMES[item.platform] ?? item.platform}
          </span>
        )}
        {item.platformCount > 0 && (
          <span className={styles.count}>{item.platformCount} 个平台讨论</span>
        )}
      </div>
    </article>
  );
}

/**
 * 个性推荐视图：
 * - AI ready 且有 recommendations 时展示真实推荐，支持标签筛选
 * - AI 不可用 / pending / 空时显示降级占位
 * - 选中标签持久化到 localStorage
 */
export default function InterestView({
  data,
  loading,
  externalTag,
  onConsumeExternalTag,
}: InterestViewProps) {
  const [activeTag, setActiveTag] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "全部";
    } catch {
      return "全部";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, activeTag);
    } catch {
      /* 忽略 localStorage 不可用 */
    }
  }, [activeTag]);

  // 外部标签（侧边栏热门标签）到达时切换筛选，并通知 App 清空，避免覆盖页内手动切换
  useEffect(() => {
    if (externalTag) {
      setActiveTag(externalTag);
      onConsumeExternalTag?.();
    }
  }, [externalTag, onConsumeExternalTag]);

  if (loading && !data) {
    return <Loading message="正在加载推荐数据…" />;
  }

  const ai = data?.ai;
  const aiReady = ai?.available === true && ai.status === "ready";
  const recommendations = aiReady ? ai.recommendations : [];

  // 筛选栏始终展示；下方内容按 AI 状态区分
  const filtered =
    activeTag === "全部"
      ? recommendations
      : recommendations.filter((r) => r.tags.includes(activeTag));

  return (
    <div className={styles.view}>
      <div className={styles.filterBar}>
        {FILTER_TAGS.map((t) => (
          <button
            key={t}
            className={`${styles.filterBtn} ${activeTag === t ? styles.filterActive : ""}`}
            onClick={() => setActiveTag(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {recommendations.length === 0 ? (
        <div className={styles.placeholder}>
          <div className={styles.placeholderTag}>个性推荐</div>
          <p>
            {ai?.status === "pending"
              ? "AI 推荐生成中，请稍候…"
              : "个性推荐暂时不可用，请查看首页综合热点。"}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message="该分类下暂无推荐" />
      ) : (
        <div className={styles.grid}>
          {filtered.map((item, i) => (
            <RecommendCard key={`rec-${i}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
