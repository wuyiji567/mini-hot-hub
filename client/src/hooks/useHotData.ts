// 数据获取 Hook：封装加载 / 错误 / 刷新状态。
// 刷新失败时保留旧数据（符合 PRD F7：刷新失败保留旧数据）。

import { useCallback, useEffect, useState } from "react";
import type { HotResponse } from "../types";
import { fetchHot } from "../api/fetchHot";

interface UseHotDataResult {
  data: HotResponse | null;
  loading: boolean; // 首次加载
  refreshing: boolean; // 手动刷新中
  error: string | null; // 仅在首次加载且无任何数据时使用
  refreshFailed: boolean; // 刷新失败但保留了旧数据
  refresh: () => void;
}

export function useHotData(): UseHotDataResult {
  const [data, setData] = useState<HotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) {
      setRefreshing(true);
      setRefreshFailed(false);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const result = await fetchHot({ refresh: isRefresh });
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      if (isRefresh) {
        // 保留旧数据，仅标记刷新失败
        setRefreshFailed(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const refresh = useCallback(() => {
    void load(true);
  }, [load]);

  return { data, loading, refreshing, error, refreshFailed, refresh };
}
