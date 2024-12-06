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

async function createApiConnection(
  wsEndpoint: string,
  signal: AbortSignal
): Promise<ApiPromise> {
  const provider = new WsProvider(wsEndpoint);

  if (signal.aborted) throw new Error('Connection aborted');

  const api = await ApiPromise.create({ provider });

  if (signal.aborted) {
    await api.disconnect();
    throw new Error('Connection aborted');
  }

  await api.isReady;

  if (signal.aborted) {
    await api.disconnect();
    throw new Error('Connection aborted');
  }

  console.log('api connected', wsEndpoint);
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
      get().pendingConnections.from?.abort();

      const abortController = new AbortController();
      set((state) => ({
        isConnecting: true,
        error: null,
        pendingConnections: {
          ...state.pendingConnections,
          from: abortController
        }
      }));

      await get().disconnectFromChainApi();

      const api = await createApiConnection(wsEndpoint, abortController.signal);

      if (abortController.signal.aborted) {
        await api.disconnect();
        return;
      }

      api.on('disconnected', () => set({ fromChainApi: null }));
      set({ fromChainApi: api });
      return api;
    } catch (error) {
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
      get().pendingConnections.to?.abort();

      const abortController = new AbortController();
      set((state) => ({
        isConnecting: true,
        error: null,
        pendingConnections: {
          ...state.pendingConnections,
          to: abortController
        }
      }));

      await get().disconnectToChainApi();

      const api = await createApiConnection(wsEndpoint, abortController.signal);

      if (abortController.signal.aborted) {
        await api.disconnect();
        return;
      }

      api.on('disconnected', () => set({ toChainApi: null }));
      set({ toChainApi: api });
      return api;
    } catch (error) {
      if (error instanceof Error && error.message !== 'Connection aborted') {
        set({
          error:
            error instanceof Error
              ? error
              : new Error('connect to chain failed')
        });
        console.error('connect to chain failed:', error);
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
