import { ApiPromise, WsProvider } from '@polkadot/api';

export function getValidWssEndpoints(
  providers: Record<string, string>
): string[] {
  const endpoints = Object.values(providers)?.filter((provider) =>
    provider.includes('wss://')
  );
  if (endpoints.length === 0) {
    throw new Error('No valid WSS endpoints found');
  }
  return endpoints;
}
export async function connectToChain(endpoints: string[]) {
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
      console.error(`Failed to connect to ${endpoint}, trying next...`, error);
      continue;
    }
  }

  throw new Error('All connection attempts failed');
}

export async function disconnectChain(
  api: ApiPromise | null,
  chainId: string | number
): Promise<void> {
  if (api) {
    try {
      await api.disconnect();
    } catch (error) {
      console.error(`Error disconnecting from chain ${chainId}:`, error);
    }
  }
}
