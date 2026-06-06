import styles from "./Sidebar.module.css";
import type { ViewKey } from "../App";

interface SidebarProps {
  activeView: ViewKey;
  onSelectView: (view: ViewKey) => void;
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

export default function Sidebar({ activeView, onSelectView, open, onClose }: SidebarProps) {
  return (
    <>
      {open && <div className={styles.overlay} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>
          <div className={styles.logo}>🔥</div>
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
              <button key={tag} className={styles.tag} onClick={() => onSelectView("interest")}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        <footer className={styles.footer}>
          <p>本站为个人学习项目，数据来源于各平台公开信息，非官方。</p>
          <p>更新频率约 5~10 分钟。</p>
        </footer>
      </aside>
    </>
  );
}
