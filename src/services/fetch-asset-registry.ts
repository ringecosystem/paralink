'use server';
import registry from '@/assets/registry.json';
import type { ChainConfig } from '@/types/asset-registry';

export async function fetchPolkadotAssetRegistry(): Promise<ChainConfig> {
  // const res = await fetch(
  //   'https://raw.githubusercontent.com/paritytech/asset-transfer-api-registry/refs/heads/main/docs/registry.json'
  // );
  // const result = await res.json();
  // return result?.polkadot;
  return registry?.polkadot as unknown as ChainConfig;
}
