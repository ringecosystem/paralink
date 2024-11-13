'use server';
import chains from '@/assets/chains.json';
import assets from '@/assets/assets.json';

import type { ChainInfo } from '@/types/chains-info';
import type { Asset } from '@/types/assets-info';

export async function fetchChainsInfo(): Promise<ChainInfo[]> {
  // const res = await fetch('https://content.subwallet.app/api/list/chain');
  // const data = await res.json();
  // return data;
  return chains as ChainInfo[];
}

export async function fetchAssetsInfo(): Promise<Asset[]> {
  // const res = await fetch('https://content.subwallet.app/api/list/chain-asset');
  // const data = await res.json();
  // return data;
  return assets as Asset[];
}
