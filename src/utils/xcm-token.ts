import { Asset } from '@/types/assets-info';
import { BN } from '@polkadot/util';
import { getTokenList } from './xcm-chain-registry';
import { getTokenFromXcAsset } from '@/lib/registry';
import type { XcAssetData } from '@/types/asset-registry';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';

type GetAvailableTokensType = {
  sourceChain: ChainInfoWithXcAssetsData;
  targetChain: ChainInfoWithXcAssetsData;
  assets: Asset[];
};

export type AvailableToken = {
  symbol?: string;
  decimals?: number;
  icon: string;
  name: string;
  xcAssetData: XcAssetData;
  balance?: BN;
  contractAddress?: string;
};

export function getAvailableTokens({
  sourceChain,
  targetChain,
  assets
}: GetAvailableTokensType): AvailableToken[] {
  const tokens = getTokenList({ sourceChain, targetChain });
  return tokens?.map((v) => {
    const data = getTokenFromXcAsset({ xcAssetData: v, assets });
    return {
      symbol: data?.symbol,
      decimals: data?.decimals,
      icon: data?.icon ?? '/images/default-token.svg',
      name: data?.name ?? data?.symbol,
      xcAssetData: v,
      balance: undefined,
      contractAddress: undefined
    };
  });
}
