'use server';
import chains from '@/assets/chains.json';
import assets from '@/assets/assets.json';

import type { ChainInfo } from '@/types/chains-info';
import type { Asset } from '@/types/assets-info';

export async function fetchChainsInfo(): Promise<ChainInfo[]> {
  // const res = await fetch('https://content.subwallet.app/api/list/chain', {
  //   next: {
  //     revalidate: 60 * 60 * 24 // 24 hours
  //   }
  // });
  // const data = await res.json();
  // return data;
  return chains as ChainInfo[];
}

export async function fetchAssetsInfo(): Promise<Asset[]> {
  // const res = await fetch('https://content.subwallet.app/api/list/chain-asset', {
  //   next: {
  //     revalidate: 60 * 60 * 24 // 24 hours
  //   }
  // });
  // const data = await res.json();
  return assets as Asset[];
}
