import { create } from 'zustand';
import { ApiPromise, WsProvider } from '@polkadot/api';

interface ApiState {
  fromChainApi: ApiPromise | null;
  toChainApi: ApiPromise | null;
  isConnecting: boolean;
  error: Error | null;
  pendingConnections: {
    from: AbortController | null;
    to: AbortController | null;
  };
}

interface ApiActions {
  connectFromChainApi: (wsEndpoint: string) => Promise<ApiPromise | undefined>;
  connectToChainApi: (wsEndpoint: string) => Promise<ApiPromise | undefined>;
  disconnectFromChainApi: () => Promise<void>;
  disconnectToChainApi: () => Promise<void>;
  disconnectAll: () => Promise<void>;
  clearError: () => void;
}

// 辅助函数：创建API连接
async function createApiConnection(
  wsEndpoint: string,
  signal: AbortSignal
): Promise<ApiPromise> {
  const provider = new WsProvider(wsEndpoint);

  // 如果已经被取消，直接抛出错误
  if (signal.aborted) throw new Error('Connection aborted');

  const api = await ApiPromise.create({ provider });

  // 再次检查是否已被取消
  if (signal.aborted) {
    await api.disconnect();
    throw new Error('Connection aborted');
  }

  await api.isReady;

  // 最后检查一次是否已被取消
  if (signal.aborted) {
    await api.disconnect();
    throw new Error('Connection aborted');
  }

  console.log('api启动成功', wsEndpoint);
  return api;
}

const useApiStore = create<ApiState & ApiActions>((set, get) => ({
  fromChainApi: null,
  toChainApi: null,
  isConnecting: false,
  error: null,
  pendingConnections: {
    from: null,
    to: null
  },

  connectFromChainApi: async (wsEndpoint: string) => {
    if (!wsEndpoint) return;

    try {
      // 取消之前的连接尝试
      get().pendingConnections.from?.abort();

      // 创建新的 AbortController
      const abortController = new AbortController();
      set((state) => ({
        isConnecting: true,
        error: null,
        pendingConnections: {
          ...state.pendingConnections,
          from: abortController
        }
      }));

      // 断开现有连接
      await get().disconnectFromChainApi();

      const api = await createApiConnection(wsEndpoint, abortController.signal);

      // 如果连接已被取消，断开并返回
      if (abortController.signal.aborted) {
        await api.disconnect();
        return;
      }

      api.on('disconnected', () => set({ fromChainApi: null }));
      set({ fromChainApi: api });
      return api;
    } catch (error) {
      // 只有在不是主动取消的情况下才设置错误
      if (error instanceof Error && error.message !== 'Connection aborted') {
        set({
          error: error instanceof Error ? error : new Error('连接源链失败')
        });
        console.error('连接源链失败:', error);
      }
    } finally {
      set((state) => ({
        isConnecting: false,
        pendingConnections: {
          ...state.pendingConnections,
          from: null
        }
      }));
    }
  },

  connectToChainApi: async (wsEndpoint: string) => {
    if (!wsEndpoint) return;

    try {
      // 取消之前的连接尝试
      get().pendingConnections.to?.abort();

      // 创建新的 AbortController
      const abortController = new AbortController();
      set((state) => ({
        isConnecting: true,
        error: null,
        pendingConnections: {
          ...state.pendingConnections,
          to: abortController
        }
      }));

      // 断开现有连接
      await get().disconnectToChainApi();

      const api = await createApiConnection(wsEndpoint, abortController.signal);

      // 如果连接已被取消，断开并返回
      if (abortController.signal.aborted) {
        await api.disconnect();
        return;
      }

      api.on('disconnected', () => set({ toChainApi: null }));
      set({ toChainApi: api });
      return api;
    } catch (error) {
      // 只有在不是主动取消的情况下才设置错误
      if (error instanceof Error && error.message !== 'Connection aborted') {
        set({
          error: error instanceof Error ? error : new Error('连接目标链失败')
        });
        console.error('连接目标链失败:', error);
      }
    } finally {
      set((state) => ({
        isConnecting: false,
        pendingConnections: {
          ...state.pendingConnections,
          to: null
        }
      }));
    }
  },

  disconnectFromChainApi: async () => {
    const { fromChainApi } = get();
    if (fromChainApi?.isConnected) {
      await fromChainApi.disconnect();
      set({ fromChainApi: null });
    }
  },

  disconnectToChainApi: async () => {
    const { toChainApi } = get();
    if (toChainApi?.isConnected) {
      await toChainApi.disconnect();
      set({ toChainApi: null });
    }
  },

  disconnectAll: async () => {
    // 取消所有待处理的连接
    get().pendingConnections.from?.abort();
    get().pendingConnections.to?.abort();

    await Promise.all([
      get().disconnectFromChainApi(),
      get().disconnectToChainApi()
    ]);
  },

  clearError: () => set({ error: null })
}));

export default useApiStore;
