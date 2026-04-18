import { useState, useEffect, useCallback } from 'react';

interface UseTauriCommandResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  refetch: () => Promise<T | null>;
}

/**
 * 自定义 Hook：封装 Tauri invoke 调用
 * 支持 loading、error、data 状态和自动刷新
 */
export function useTauriCommand<T>(
  command: string,
  options?: {
    args?: Record<string, unknown>;
    autoFetch?: boolean;
    refreshInterval?: number;
  }
): UseTauriCommandResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (..._args: unknown[]): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        // 尝试使用 Tauri invoke，如果不在 Tauri 环境中则返回模拟数据
        let result: T;
        if (typeof window !== 'undefined' && '__TAURI__' in window) {
          const { invoke } = await import('@tauri-apps/api/tauri');
          result = await invoke<T>(command, options?.args);
        } else {
          // 非Tauri环境返回null（页面使用模拟数据）
          result = null as unknown as T;
        }
        setData(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : '未知错误';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [command, options?.args]
  );

  const refetch = useCallback(async () => {
    return execute();
  }, [execute]);

  // 自动获取
  useEffect(() => {
    if (options?.autoFetch !== false) {
      execute();
    }
  }, [execute, options?.autoFetch]);

  // 自动刷新
  useEffect(() => {
    if (!options?.refreshInterval) return;
    const timer = setInterval(() => {
      execute();
    }, options.refreshInterval);
    return () => clearInterval(timer);
  }, [options?.refreshInterval, execute]);

  return { data, loading, error, execute, refetch };
}
