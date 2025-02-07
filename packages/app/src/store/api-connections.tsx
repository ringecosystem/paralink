import { BN_ZERO } from '@polkadot/util';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import useChainsStore from './chains';
import { Button } from '@/components/ui/button';
import { sortEndpoints } from '@/utils/endpoint';

async function connectToChain(endpoints: string[]) {
  for (const endpoint of endpoints) {
    try {
      console.log('excuting endpoint', endpoint);
      const api = await ApiPromise.create({
        provider: new WsProvider(endpoint, 1_000, {}, 5_000),
        throwOnConnect: true
      });

      console.log(`Successfully connected to ${endpoint}`);
      await api.isReady;
      return api;
    } catch (error) {
      console.error(`Failed to connect to ${endpoint}, trying next...`);
      continue;
    }
  }

  toast.error(
    (t) => (
      <div className="flex items-center gap-2">
        <p>Connection failed. Please check your network and try again.</p>
        <div>
          <Button
            onClick={() => {
              window.location.reload();
            }}
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>
    ),
    {
      position: 'bottom-right',
      duration: 10_000,
      className: 'text-[14px]'
    }
  );
  throw new Error('All connection attempts failed');
}

interface ApiConnection {
  api: ApiPromise;
  endpoints: string[];
}
export type GetValidApiType = (paraId: number) => Promise<ApiPromise>;

interface ApiConnectionsStore {
  connections: Record<string, ApiConnection>;
  loadingStates: Record<number, boolean>;
  pendingConnections: Record<string, Promise<ApiPromise> | undefined>;
  getValidApi: GetValidApiType;
  clearPendingConnection: (paraId: number) => void;
}

const useApiConnectionsStore = create<ApiConnectionsStore>((set, get) => ({
  connections: {},
  loadingStates: {},
  pendingConnections: {},
  clearPendingConnection: (paraId: number) => {
    set((state) => ({
      pendingConnections: {
        ...state.pendingConnections,
        [paraId]: undefined
      },
      loadingStates: {
        ...state.loadingStates,
        [paraId]: false
      }
    }));
  },

  getValidApi: async (paraId: number) => {
    const { connections, pendingConnections, clearPendingConnection } = get();

    if (pendingConnections[paraId]) {
      set((state) => ({
        loadingStates: {
          ...state.loadingStates,
          [paraId]: true
        }
      }));
      try {
        const api = await pendingConnections[paraId];

        return api;
      } catch (error: any) {
        console.error('waiting for connection failed:', error);
        throw new Error(`connection failed: ${error?.message}`);
      } finally {
        clearPendingConnection(paraId);
      }
    }

    // 2. check existing connection is healthy
    const existingConnection = connections[paraId];
    if (existingConnection?.api.isConnected) {
      set((state) => ({
        loadingStates: {
          ...state.loadingStates,
          [paraId]: true
        }
      }));
      try {
        const health = await existingConnection.api.rpc.system.health();

        if (
          health.isSyncing?.isFalse &&
          health.peers.toBn().gt(BN_ZERO) &&
          health.shouldHavePeers?.isTrue
        ) {
          set((state) => ({
            loadingStates: {
              ...state.loadingStates,
              [paraId]: false
            }
          }));
          return existingConnection.api;
        }
      } catch (error) {
        console.error('check api health failed:', error);
      } finally {
        set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [paraId]: false
          }
        }));
      }
    }
    const chains = useChainsStore.getState().chains;
    // 3. create new connection Promise
    const connectionPromise = (async () => {
      // if (!chains?.length) return;
      set((state) => ({
        loadingStates: {
          ...state.loadingStates,
          [paraId]: true
        }
      }));
      try {
        const endpoints = chains?.find(
          (chain) => chain.id === paraId
        )?.providers;
        if (!endpoints || !endpoints.length)
          throw new Error('must provide at least one node');
        const sortedEndpoints = sortEndpoints(endpoints);
        const api = await connectToChain(sortedEndpoints);

        set((state) => ({
          connections: {
            ...state.connections,
            [paraId]: { api, endpoints: endpoints }
          },
          pendingConnections: {
            ...state.pendingConnections,
            [paraId]: undefined
          },
          loadingStates: {
            ...state.loadingStates,
            [paraId]: false
          }
        }));

        return api;
      } catch (error) {
        console.error('create api connection failed:', error);
        set((state) => ({
          pendingConnections: {
            ...state.pendingConnections,
            [paraId]: undefined
          },
          loadingStates: {
            ...state.loadingStates,
            [paraId]: false
          }
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
