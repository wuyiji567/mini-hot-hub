import styles from "./Sidebar.module.css";
import type { ViewKey } from "../App";

interface SidebarProps {
  activeView: ViewKey;
  onSelectView: (view: ViewKey) => void;
  onSelectTag: (tag: string) => void; // 热门标签点击：跳个性推荐并筛选该标签
  open: boolean; // 移动端是否展开
  onClose: () => void;
}

const NAV_ITEMS: { key: ViewKey; label: string; icon: string }[] = [
  { key: "home", label: "首页", icon: "🏠" },
  { key: "interest", label: "个性推荐", icon: "✨" },
  { key: "platform", label: "平台", icon: "📊" },
];

// 热门标签（第一阶段为占位，点击暂跳转到个性推荐入口）
const HOT_TAGS = ["科技", "娱乐", "体育", "财经", "社会"];

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
            <div className={styles.siteName}>今日热搜</div>
            <div className={styles.tagline}>Mini Hot Hub</div>
          </div>
        </div>

        <div className={styles.search}>
          <input type="text" placeholder="搜索（即将上线）" disabled />
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`${styles.navItem} ${activeView === item.key ? styles.active : ""}`}
              onClick={() => onSelectView(item.key)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className={styles.tagsSection}>
          <div className={styles.sectionTitle}>热门标签</div>
          <div className={styles.tagList}>
            {HOT_TAGS.map((tag) => (
              <button key={tag} className={styles.tag} onClick={() => onSelectTag(tag)}>
                {tag}
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
