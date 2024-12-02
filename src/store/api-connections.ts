import { ApiPromise, WsProvider } from '@polkadot/api';
import { isNil } from 'lodash-es';
import { create } from 'zustand';

interface ApiConnection {
  api: ApiPromise;
  lastUsed: number;
  status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'ERROR';
  reconnectAttempts: number;
}

interface ApiConnectionsStore {
  connections: Record<string, ApiConnection>;
  connectApi: (
    paraId: string,
    endpoint: string | string[]
  ) => Promise<ApiPromise | null>;
  getApi: (paraId: string | number | undefined | null) => ApiPromise | null;
  disconnectApi: (paraId: string) => Promise<void>;
}

const MAX_ACTIVE_CONNECTIONS = 6;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 1000;

const useApiConnectionsStore = create<ApiConnectionsStore>((set, get) => ({
  connections: {},

  connectApi: async (paraId: string, endpoint: string | string[]) => {
    const state = get();
    const existingConnection = state.connections[paraId];

    if (existingConnection?.status === 'CONNECTED') {
      try {
        await existingConnection.api.isReady;
        console.log(
          `Chain ${paraId} connection is valid, returning existing connection`
        );
        set((state) => ({
          connections: {
            ...state.connections,
            [paraId]: {
              ...existingConnection,
              lastUsed: Date.now()
            }
          }
        }));
        return existingConnection.api;
      } catch (e) {
        console.error(`Failed to connect to chain ${paraId}:`, e);
      }
    }

    if (existingConnection?.status === 'CONNECTING') {
      try {
        await existingConnection.api.isReady;
        console.log(`Chain ${paraId} connected successfully`);
        return existingConnection.api;
      } catch (err) {
        console.error(`Failed to connect to chain ${paraId}:`, err);
      }
    }

    if (existingConnection?.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error(`Max reconnection attempts reached for chain ${paraId}`);
      return null;
    }

    set((state) => ({
      connections: {
        ...state.connections,
        [paraId]: {
          ...existingConnection,
          status: 'CONNECTING',
          lastUsed: Date.now(),
          reconnectAttempts: (existingConnection?.reconnectAttempts ?? 0) + 1
        }
      }
    }));

    try {
      const provider = new WsProvider(endpoint);
      const api = await ApiPromise.create({
        provider,
        throwOnConnect: true
      });

      await api.isReady;
      console.log(`Chain ${paraId} new connection created successfully`);

      const currentConnections = Object.entries(get().connections);
      if (currentConnections.length >= MAX_ACTIVE_CONNECTIONS) {
        const oldestConnection = currentConnections.sort(
          ([, a], [, b]) => a.lastUsed - b.lastUsed
        )[0];
        if (oldestConnection) {
          await get().disconnectApi(oldestConnection[0]);
        }
      }

      set((state) => ({
        connections: {
          ...state.connections,
          [paraId]: {
            api,
            lastUsed: Date.now(),
            status: 'CONNECTED',
            reconnectAttempts: 0
          }
        }
      }));

      return api;
    } catch (error) {
      console.error(`Failed to connect to chain ${paraId}:`, error);
      await new Promise((resolve) => setTimeout(resolve, RECONNECT_DELAY));

      set((state) => ({
        connections: {
          ...state.connections,
          [paraId]: {
            ...existingConnection,
            status: 'ERROR',
            lastUsed: Date.now()
          }
        }
      }));
      return null;
    }
  },

  disconnectApi: async (paraId: string) => {
    const connection = get().connections[paraId];
    if (connection?.api) {
      await connection.api.disconnect();
      set((state) => ({
        connections: {
          ...state.connections,
          [paraId]: {
            ...connection,
            status: 'DISCONNECTED'
          }
        }
      }));
    }
  },

  getApi: (paraId: string | number | undefined | null) => {
    if (isNil(paraId)) return null;
    const connection = get().connections[paraId];
    if (!connection || connection.status !== 'CONNECTED') {
      return null;
    }
    return connection.api;
  }
}));

export default useApiConnectionsStore;
