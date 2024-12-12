import { BN_ZERO } from '@polkadot/util';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { create } from 'zustand';
import { filterWorkingWssProviders } from '@/utils/rpc-endpoint';
import useChainsStore from './chains';

interface ApiConnection {
  api: ApiPromise;
  endpoints: string[];
}
export type GetValidApiType = (paraId: number) => Promise<ApiPromise>;

interface ApiConnectionsStore {
  connections: Record<string, ApiConnection>;
  isLoading: boolean;
  pendingConnections: Record<string, Promise<ApiPromise> | undefined>;
  getValidApi: GetValidApiType;
  clearPendingConnection: (paraId: number) => void;
}

const CONNECTION_TIMEOUT = 15000;

const useApiConnectionsStore = create<ApiConnectionsStore>((set, get) => ({
  connections: {},
  isLoading: false,
  pendingConnections: {},
  clearPendingConnection: (paraId: number) => {
    set((state) => ({
      pendingConnections: {
        ...state.pendingConnections,
        [paraId]: undefined
      },
      isLoading: false
    }));
  },

  getValidApi: async (paraId: number) => {
    const { connections, pendingConnections, clearPendingConnection } = get();

    if (pendingConnections[paraId]) {
      set({ isLoading: true });
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('connection timeout'));
          }, CONNECTION_TIMEOUT);
        });

        const api = await Promise.race([
          pendingConnections[paraId],
          timeoutPromise
        ]);

        return api;
      } catch (error: any) {
        console.error('waiting for connection failed:', error);
        clearPendingConnection(paraId);
        throw new Error(`connection failed: ${error?.message}`);
      }
    }

    // 2. check existing connection is healthy
    const existingConnection = connections[paraId];
    if (existingConnection?.api.isConnected) {
      set({ isLoading: true });
      try {
        const health = await existingConnection.api.rpc.system.health();

        if (
          health.isSyncing?.isFalse &&
          health.peers.toBn().gt(BN_ZERO) &&
          health.shouldHavePeers?.isTrue
        ) {
          set({ isLoading: false });
          return existingConnection.api;
        }
      } catch (error) {
        console.error('check api health failed:', error);
      } finally {
        set({ isLoading: false });
      }
    }
    const chains = useChainsStore.getState().chains;
    // 3. create new connection Promise
    const connectionPromise = (async () => {
      // if (!chains?.length) return;
      set({ isLoading: true });
      try {
        const endpoints = chains?.find(
          (chain) => chain.id === paraId
        )?.providers;
        if (!endpoints || !endpoints.length)
          throw new Error('must provide at least one node');
        const bestEndpoint = await filterWorkingWssProviders(endpoints);
        if (!bestEndpoint.length) {
          throw new Error('No valid WebSocket endpoints found');
        }
        const api = await ApiPromise.create({
          provider: new WsProvider(bestEndpoint, 6000),
          throwOnConnect: true
        });

        set((state) => ({
          connections: {
            ...state.connections,
            [paraId]: { api, endpoints: endpoints }
          },
          pendingConnections: {
            ...state.pendingConnections,
            [paraId]: undefined
          },
          isLoading: false
        }));

        return api;
      } catch (error) {
        console.error('create api connection failed:', error);
        set((state) => ({
          pendingConnections: {
            ...state.pendingConnections,
            [paraId]: undefined
          },
          isLoading: false
        }));
        throw error;
      }
    })();

    // important: store pending promise before starting async operation
    set((state) => ({
      pendingConnections: {
        ...state.pendingConnections,
        [paraId]: connectionPromise
      }
    }));

    return connectionPromise;
  }
}));

export default useApiConnectionsStore;
