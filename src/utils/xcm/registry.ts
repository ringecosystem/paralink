import type { Asset, ChainConfig } from '@/types/registry';


export function getFromChains(chains: ChainConfig[]): ChainConfig[] {
  return chains;
}

export function getToChains(
  chains: ChainConfig[],
  sourceChainId: number
): ChainConfig[] {
  return chains?.filter((chain) => chain.id !== sourceChainId);
}

export const getTokenList = ({
  sourceChain,
  targetChainId
}: {
  sourceChain: ChainConfig;
  targetChainId: number;
}) => {
  const tokenList: Asset[] = [];
  if (sourceChain.id === 1000) {
    const tokens = sourceChain?.localAssets?.[targetChainId];
    return tokens || [];
  } else {
    const nativeToken =
      sourceChain?.nativeToken?.registeredChains?.[targetChainId];
    const xcAssetsData = sourceChain?.xcAssetsData?.[targetChainId];

    if (nativeToken) {
      tokenList.push({ ...nativeToken, isNative: true });
    }
    if (Array.isArray(xcAssetsData) && xcAssetsData.length) {
      tokenList.push(...xcAssetsData);
    }

    return tokenList;
  }
};
