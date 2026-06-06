// 内存缓存：Map + TTL。第一阶段只用 hot:all 缓存完整响应。

interface CacheEntry<T> {
  value: T;
  expireAt: number; // 毫秒时间戳
}

const store = new Map<string, CacheEntry<unknown>>();

/** 默认 TTL（秒），可通过环境变量 CACHE_TTL 覆盖 */
export const DEFAULT_TTL = Number(process.env.CACHE_TTL ?? 300);

/** 读取缓存；未命中或已过期返回 undefined（过期条目顺手清理） */
export function getCache<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expireAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

/** 写入缓存，ttlSeconds 缺省用 DEFAULT_TTL */
export function setCache<T>(key: string, value: T, ttlSeconds: number = DEFAULT_TTL): void {
  store.set(key, { value, expireAt: Date.now() + ttlSeconds * 1000 });
}

/** 删除指定 key（如强制刷新前清理） */
export function deleteCache(key: string): void {
  store.delete(key);
}

/** 清空全部缓存（测试用） */
export function clearCache(): void {
  store.clear();
}
