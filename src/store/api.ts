import { create } from 'zustand';
import type { ApiPromise } from '@polkadot/api';
import { connectToChain } from '@/lib/chain/api';

interface ApiState {
  fromChainApi: ApiPromise | null;
  toChainApi: ApiPromise | null;
  isConnecting: boolean;
  error: Error | null;
}

interface ApiActions {
  connectFromChainApi: (wsEndpoint: string) => Promise<ApiPromise | undefined>;
  connectToChainApi: (wsEndpoint: string) => Promise<ApiPromise | undefined>;
  disconnectFromChainApi: () => Promise<void>;
  disconnectToChainApi: () => Promise<void>;
  disconnectAll: () => Promise<void>;
  clearError: () => void;
}

const useApiStore = create<ApiState & ApiActions>((set, get) => ({
  fromChainApi: null,
  toChainApi: null,
  isConnecting: false,
  error: null,

  connectFromChainApi: async (
    wsEndpoint: string
  ): Promise<ApiPromise | undefined> => {
    try {
      set({ isConnecting: true, error: null });
      await get().disconnectFromChainApi();

      const api = await connectToChain({
        wsEndpoint,
        onDisconnect: () => {
          set({ fromChainApi: null });
        }
      });
      set({ fromChainApi: api });
      return api;
    } catch (error) {
      set({ error: error as Error });
      console.error('Failed to connect from chain:', error);
    } finally {
      set({ isConnecting: false });
    }
  },

  connectToChainApi: async (
    wsEndpoint: string
  ): Promise<ApiPromise | undefined> => {
    try {
      set({ isConnecting: true, error: null });
      await get().disconnectToChainApi();

      const api = await connectToChain({
        wsEndpoint,
        onDisconnect: () => {
          set({ toChainApi: null });
        }
      });
      set({ toChainApi: api });
      return api;
    } catch (error) {
      set({ error: error as Error });
      console.error('Failed to connect to chain:', error);
    } finally {
      set({ isConnecting: false });
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
    await Promise.all([
      get().disconnectFromChainApi(),
      get().disconnectToChainApi()
    ]);
  },

  clearError: () => set({ error: null })
}));

export default useApiStore;
