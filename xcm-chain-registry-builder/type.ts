export enum ParaId {
  ASSET_HUB_POLKADOT = 1000,
  COLLECTIVES = 1001,
  BRIDGE_HUB_POLKADOT = 1002,
  PEOPLE = 1004,
  CORETIME = 1005,

  ACALA = 2000,
  CLOVER = 2002,
  MOONBEAM = 2004,
  ASTAR = 2006,
  TOTEM = 2007,
  CRUST = 2008,
  EQUILIBRIUM = 2011,
  PARALLEL = 2012,
  LITENTRY = 2013,
  COMPOSABLE = 2019,
  SORA = 2025,
  NODLE = 2026,
  BIFROST = 2030,
  CENTRIFUGE = 2031,
  INTERLAY = 2032,
  HYDRATION = 2034,
  PHALA = 2035,
  UNIQUE = 2037,
  INTEGRITEE = 2039,
  POLKADEX = 2040,
  NEUROWEB = 2043,
  DARWINIA = 2046,
  BITGREEN = 2048,
  AJUNA = 2051,
  KILT = 2086,
  OAK = 2090,
  FREQUENCY = 2091,
  ZEITGEIST = 2092,
  HASHED = 2093,
  PENDULUM = 2094,
  SUBSOCIAL = 2101,
  MANTA = 2104,

  T3RN = 3333,
  PEAQ = 3338,
  INVARCH = 3340,
  POLIMEC = 3344,
  ENERGY_WEB_X = 3345,
  CONTINUUM = 3346,
  LOGION = 3354,
  HYPERBRIDGE = 3367,
  MYTHOS = 3369,
  LAOS = 3370,
  ROBONOMICS = 3388
}

export interface ChainInfo {
  slug: string;
  name: string;
  isTestnet: boolean;
  chainStatus: 'ACTIVE' | 'INACTIVE';
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

export enum ReserveType {
  Local = 'local',
  Foreign = 'foreign',
  Remote = 'remote'
}
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

export interface ChainRegistryAssetInfo {
  assetId: string | number;
  symbol: string;
  decimals: number;
  xcmLocation?: string;
  icon?: string;
}

export interface ChainRegistryProviders {
  [provider: string]: string;
}

export interface ChainRegistryEvmInfo extends EvmInfo {
  blockExplorer: string;
}

export interface RegisteredChainInfo {
  assetId: string | number;
  symbol?: string;
  decimals?: number;
  icon?: string;
  reserveType?: ReserveType;
  xcmLocation?: string;
  isNative?: boolean;
}

export interface ChainRegistryNativeToken {
  symbol: string;
  decimals: number;
  icon?: string;
  registeredChains?: {
    [chainId: string]: RegisteredChainInfo | null;
  } | null;
}

export interface ChainRegistryAssetInfoData {
  [paraId: string]: ChainRegistryAssetInfo[] | null;
}
export interface ChainRegistryXcAssetData {
  [paraId: string]: ChainRegistryAssetInfo[] | null;
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
  nativeToken?: ChainRegistryNativeToken | null;
  localAssets?: ChainRegistryAssetInfoData | null;
  xcAssetsData?: ChainRegistryXcAssetData | null;
}

export interface ChainRegistry {
  [chainId: string]: ChainRegistryInfo | null;
}
