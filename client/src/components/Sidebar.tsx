import styles from "./Sidebar.module.css";
import type { ViewKey } from "../App";

interface SidebarProps {
  activeView: ViewKey;
  onSelectView: (view: ViewKey) => void;
  onSelectTag: (tag: string) => void; // 热门标签点击：跳个性推荐并筛选该标签
  open: boolean; // 移动端是否展开
  onClose: () => void;
}

const NAV_ITEMS: { key: ViewKey; label: string; badge?: string }[] = [
  { key: "home", label: "首页" },
  { key: "interest", label: "个性推荐", badge: "AI" },
  { key: "platform", label: "平台" },
];

/** 导航线性 SVG 图标（房子 / 星光 / 网格） */
function NavIcon({ view }: { view: ViewKey }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  } as const;
  if (view === "home") {
    return (
      <svg {...common}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  }
  if (view === "interest") {
    return (
      <svg {...common}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

// 热门标签：行式导航 + 彩色圆点（点击跳个性推荐并筛选）
const HOT_TAGS: { label: string; key: string }[] = [
  { label: "科技", key: "tech" },
  { label: "娱乐", key: "entertainment" },
  { label: "体育", key: "sports" },
  { label: "财经", key: "finance" },
  { label: "社会", key: "society" },
];

export default function Sidebar({
  activeView,
  onSelectView,
  onSelectTag,
  open,
  onClose,
}: SidebarProps) {
  return (
    <>
      {open && <div className={styles.overlay} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            {/* 品牌星芒图标（来自设计稿，内联 SVG，非 emoji） */}
            <svg className={styles.logoSvg} viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path
                className={styles.sparkMain}
                d="M16 2c.7 7 4 10.3 14 14-10 3.7-13.3 7-14 14-.7-7-4-10.3-14-14C12 12.3 15.3 9 16 2Z"
                fill="currentColor"
              />
              <path
                className={styles.sparkDot}
                d="M25.5 3.5c.3 2.6 1.4 3.7 4.5 5-3.1 1.3-4.2 2.4-4.5 5-.3-2.6-1.4-3.7-4.5-5 3.1-1.3 4.2-2.4 4.5-5Z"
                fill="var(--color-heat)"
              />
            </svg>
          </div>
          <div>
            <div className={styles.siteName}>
              今日<span className={styles.siteNameAccent}>热搜</span>
            </div>
            <div className={styles.tagline}>汇聚全网热点</div>
          </div>
        </div>

        <div className={styles.search}>
          {/* 占位搜索框（不实现真实搜索） */}
          <div className={styles.searchBox} aria-disabled="true">
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>搜索话题 / 平台...</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`${styles.navItem} ${activeView === item.key ? styles.active : ""}`}
              onClick={() => onSelectView(item.key)}
            >
              <span className={styles.navIcon}>
                <NavIcon view={item.key} />
              </span>
              {item.label}
              {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className={styles.tagsSection}>
          <div className={styles.sectionTitle}>热门标签</div>
          <div className={styles.hotTagList}>
            {HOT_TAGS.map((tag) => (
              <button
                key={tag.key}
                className={styles.navItem}
                onClick={() => onSelectTag(tag.label)}
              >
                <span className={styles.navIcon}>
                  <span
                    className={styles.hotTagDot}
                    style={{ background: `var(--tag-${tag.key})` }}
                  />
                </span>
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        <footer className={styles.footer}>
          <p>本站为个人学习项目，非商用，非官方。</p>
          <p>数据来源于各平台公开信息，内容版权与责任归原平台及原作者所有。</p>
          <p>AI 推荐和标签由 AI 自动生成，仅供参考。</p>
          <p>数据约每 5 分钟更新一次。</p>
          <p>如有侵权或不当内容，请通过项目仓库 Issue 联系处理。</p>
        </footer>
      </aside>
    </>
  );
}
