import { ReserveType } from './enum';
import type { XcmV1Location } from './xcm-location';


export type Asset = {
  isNative?: boolean;
  assetId: string | number | { [key: string]: string | number };
  symbol: string;
  decimals: number;
  xcmLocation: XcmV1Location;
  icon: string;
  reserveType: ReserveType;
};

export type NativeToken = {
  symbol: string;
  decimals: number;
  icon: string;
  registeredChains: {
    [chainId: string]: Asset;
  };
};

export type Chain = {
  slug: string;
  name: string;
  icon: string;
  addressPrefix: number;
  providers: string[];
  alive: boolean;
  existentialDeposit: string;
  assetsType: 'assets' | 'tokens';
  isEvm: boolean;
  explorer: string;
  evmChainId?: number;
  nativeToken: NativeToken;
  xcAssetsData?: XcAssetsData;
  localAssets?: {
    [chainId: string]: Asset[];
  };
};

export type ChainConfig = Chain & {
  id: number;
};

export type ChainRegistry = Record<string, Chain>;

export type XcAssetsData = Record<string, Asset[]>;
