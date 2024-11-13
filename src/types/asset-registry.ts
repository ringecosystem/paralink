export interface Registry {
  [chainName: string]: ChainConfig;
}

export interface ChainConfig {
  [paraId: string]: ParaChainConfig;
}

export interface ParaChainConfig {
  tokens: string[];
  assetsInfo: {
    [assetId: string]: string;
  };
  foreignAssetsInfo: {
    [key: string]: ForeignAssetInfo;
  };
  poolPairsInfo: {
    [pairId: string]: PoolPairInfo;
  };
  specName: string;
  xcAssetsData?: XcAssetData[];
}

export interface ForeignAssetInfo {
  symbol: string;
  name: string;
  multiLocation: string;
  assetHubReserveLocation: string;
  originChainReserveLocation: string;
}

export type AssetType =
  | string
  | { ForeignAsset: string }
  | { XCM: string }
  | { Native: string }
  | { Token: string }
  | { Token2: string }
  | { VToken2: string }
  | { VSToken2: string };

export interface XcAssetData {
  paraID: number;
  nativeChainID: string | null;
  symbol: string;
  decimals: number;
  xcmV1MultiLocation: string;
  asset: AssetType;
  assetHubReserveLocation: string;
  originChainReserveLocation?: string;
}
export interface PoolPairInfo {
  lpToken: string;
  pairInfo: string;
}
