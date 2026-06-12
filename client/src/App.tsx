import { useState } from "react";
import styles from "./App.module.css";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import HomeView from "./components/views/HomeView";
import PlatformView from "./components/views/PlatformView";
import InterestView from "./components/views/InterestView";
import ErrorCard from "./components/ErrorCard";
import Toast from "./components/Toast";
import { useHotData } from "./hooks/useHotData";

export type ViewKey = "home" | "interest" | "platform";

const VIEW_META: Record<ViewKey, { title: string; subtitle: string }> = {
  home: { title: "首页 · 综合热点", subtitle: "正在捕捉全网温度" },
  interest: { title: "个性推荐", subtitle: "为你调频" },
  platform: { title: "平台热榜", subtitle: "各站现场" },
};

export default function App() {
  const [view, setView] = useState<ViewKey>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // 外部请求的个性推荐筛选标签（侧边栏热门标签点击）；消费后清空，避免覆盖用户在页内的手动切换
  const [interestTag, setInterestTag] = useState<string | null>(null);
  const { data, loading, refreshing, error, refreshFailed, refresh, dismissRefreshFailed } =
    useHotData();

  const meta = VIEW_META[view];

  return (
    <div className={styles.layout}>
      <Sidebar
        activeView={view}
        onSelectView={(v) => {
          setView(v);
          setSidebarOpen(false);
        }}
        onSelectTag={(tag) => {
          setInterestTag(tag);
          setView("interest");
          setSidebarOpen(false);
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={styles.main}>
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          updatedAt={data?.updatedAt ?? null}
          refreshing={refreshing}
          onRefresh={refresh}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        <main className={styles.content}>
          {error && !data ? (
            <ErrorCard message={`数据加载失败：${error}`} onRetry={refresh} />
          ) : view === "home" ? (
            <HomeView data={data} loading={loading} />
          ) : view === "platform" ? (
            <PlatformView data={data} loading={loading} onRetry={refresh} />
          ) : (
            <InterestView
              data={data}
              loading={loading}
              externalTag={interestTag}
              onConsumeExternalTag={() => setInterestTag(null)}
            />
          )}
        </main>
      </div>

      {/* 刷新失败但保留旧数据时的轻量提示（PRD F7） */}
      {refreshFailed && (
        <Toast message="刷新失败，显示的是之前的数据" onClose={dismissRefreshFailed} />
      )}
    </div>
  );
}
