import type { XcAssetData } from './asset-registry';
import type { BN } from '@polkadot/util';

export type Token = {
  symbol: string;
  icon: string;
  name?: string;
};

export type TokenWithBalance = Token & {
  balance?: BN;
  price?: string;
  address?: string;
  xcAssetData?: XcAssetData;
  contractAddress?: string;
  decimals?: number;
};
