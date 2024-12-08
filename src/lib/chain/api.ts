import { ApiPromise, WsProvider } from '@polkadot/api';

export interface ConnectOptions {
  wsEndpoint: string;
  onDisconnect?: () => void;
}

export async function connectToChain({
  wsEndpoint,
  onDisconnect
}: ConnectOptions): Promise<ApiPromise> {
  try {
    const provider = new WsProvider(wsEndpoint);

    provider.on('disconnected', () => {
      console.warn('Disconnected from', wsEndpoint);
      onDisconnect?.();
    });

    const api = await ApiPromise.create({
      provider,
      throwOnConnect: true
    });

    await api.isReady;
    return api;
  } catch (error) {
    console.error('Failed to connect to', wsEndpoint, error);
    throw error;
  }
}
