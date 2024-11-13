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

// 常量映射
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

// 辅助类型
export type AssetType = keyof typeof ASSET_TYPES;
export type AssetRefType = keyof typeof ASSET_REF_TYPES;
