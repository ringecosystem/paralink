import type { XcAssetData } from './asset-registry';

export type Token = {
  symbol: string;
  icon: string;
  name?: string;
};

export type TokenWithBalance = Token & {
  balance?: string;
  price?: string;
  address?: string;
  xcAssetData?: XcAssetData;
};
