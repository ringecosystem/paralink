import { ChainStatus, ReserveType } from './enum';
import { XcmV1Location } from './xcm-location';

export interface ChainInfo {
  slug: string;
  name: string;
  isTestnet: boolean;
  chainStatus: ChainStatus;
  ordinal: number;
  icon: string;
  providers: Record<string, string>;
  evmInfo: EvmInfo | null;
  substrateInfo: SubstrateInfo | null;
  extraInfo: ExtraInfo | null;
  bitcoinInfo: BitcoinInfo | null;
  tonInfo: TonInfo | null;
}

export interface EvmInfo {
  evmChainId: number;
  blockExplorer: string;
  existentialDeposit: string;
  symbol: string;
  decimals: number;
  supportSmartContract: Array<'ERC20' | 'ERC721'>;
  abiExplorer: string | null;
}

export interface CrowdloanFund {
  relayChain: 'polkadot' | 'kusama';
  fundId: string;
  paraId: number;
  status: 'won' | 'failed';
  startTime: string;
  endTime: string;
  auctionIndex: number;
  firstPeriod: number;
  lastPeriod: number;
}

export interface SubstrateInfo {
  relaySlug: string | null;
  paraId: number | null;
  genesisHash: string;
  addressPrefix: number;
  chainType: 'RELAYCHAIN' | 'PARACHAIN';
  crowdloanUrl: string | null;
  blockExplorer: string | null;
  existentialDeposit: string;
  symbol: string;
  decimals: number;
  hasNativeNft: boolean | null;
  supportStaking: boolean | null;
  supportSmartContract: null;
  crowdloanParaId: number | null;
  crowdloanFunds: CrowdloanFund[];
}

export interface ExtraInfo {
  subscanSlug: string | null;
  chainBalanceSlug: string | null;
}

export interface BitcoinInfo {
  blockExplorer: string;
  existentialDeposit: string;
  decimals: number;
  symbol: string;
  bitcoinNetwork: 'mainnet' | 'testnet';
}

export interface TonInfo {
  blockExplorer: string;
  existentialDeposit: string;
  decimals: number;
  symbol: string;
  supportSmartContract: Array<'TEP74' | 'TEP62'>;
}

interface AssetMetadata {
  contractAddress?: string;
  assetId?: string;
  multilocation?: {
    parents: number;
    interior: {
      X1: Array<{
        Parachain: number;
      }>;
    };
  };
  autoEnable?: boolean;
  onChainInfo?: {
    Stellar?: {
      AlphaNum4: {
        code: string;
        issuer: string;
      };
    };
    XCM?: string;
  };
  assetType?: string;
}

interface AssetRef {
  type: 'XCM' | 'SWAP';
  metadata: null;
  disable: boolean;
  destAsset: string;
}

export interface Asset {
  id: string;
  slug: string;
  name: string;
  symbol: string;
  decimals: number;
  priceId: string | null;
  minAmount: string;
  assetType: 'ERC20' | 'NATIVE' | 'LOCAL' | 'BRC20' | 'TEP74';
  metadata: AssetMetadata | null;
  hasValue: boolean;
  ordinal: number;
  icon: string | null;
  originChain: string;
  multiChainAsset: string | null;
  assetRefs: AssetRef[];
}

export const ASSET_TYPES = {
  ERC20: 'ERC20',
  NATIVE: 'NATIVE',
  LOCAL: 'LOCAL',
  BRC20: 'BRC20',
  TEP74: 'TEP74'
} as const;

export const ASSET_REF_TYPES = {
  XCM: 'XCM',
  SWAP: 'SWAP'
} as const;

// export type AssetType = keyof typeof ASSET_TYPES;
export type AssetRefType = keyof typeof ASSET_REF_TYPES;

export interface Registry {
  [chainName: string]: ChainConfig;
}

export interface ChainConfig {
  [paraId: string]: ParaChainConfig;
}

export interface ParaChainConfig {
  id: string;
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
  reserveType: ReserveType;
  symbol: string;
  decimals: number;
  xcmV1MultiLocation: string;
  asset: AssetType;
  assetHubReserveLocation?: string;
  originChainReserveLocation?: string;
}
export interface PoolPairInfo {
  lpToken: string;
  pairInfo: string;
}

export interface RegisteredAssetInfo {
  assetId?: AssetType;
  symbol?: string;
  name?: string;
  decimals?: number;
  icon?: string;
  reserveType?: ReserveType;
  priceId?: string;
  minAmount?: string;
  xcmLocation?: XcmV1Location;
  isNative?: boolean;
}

export interface RegisteredAssetInfoWithChains extends RegisteredAssetInfo {
  registeredChains?: {
    [chainId: string]: RegisteredAssetInfo | null;
  } | null;
}

export interface ChainRegistryXcAssetData {
  [paraId: string]: RegisteredAssetInfo[] | null;
}

export interface ChainRegistryInfo {
  explorer?: string;
  icon?: string;
  addressPrefix?: number;
  providers?: string[];
  name?: string;
  slug?: string;
  alive?: boolean;
  assetsType?: 'assets' | 'tokens' | null;
  isEvm?: boolean;
  evmChainId?: number;
  existentialDeposit?: string;
  xcmPaymentAcceptTokens?: any[];
  nativeToken?: RegisteredAssetInfoWithChains | null;
  localAssets?: RegisteredAssetInfoWithChains[] | null;
  xcAssetsData?: ChainRegistryXcAssetData | null;
}

export interface ChainRegistry {
  [chainId: string]: ChainRegistryInfo | null;
}
