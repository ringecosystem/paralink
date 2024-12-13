import { ReserveType, type Asset, type ChainConfig } from '@/types/registry';


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
  targetChain
}: {
  sourceChain: ChainConfig;
  targetChain: ChainConfig;
}) => {
  const tokenList: Asset[] = [];
  // 加入dot
  if (sourceChain?.id === 1000 && targetChain?.xcAssetsData) {
    Object.entries(targetChain?.xcAssetsData)?.forEach(([key, value]) => {
      const dotToken = value?.find(item => item?.symbol?.toLowerCase() === 'dot');
      if (dotToken) {
        tokenList.push({ ...dotToken, isNative: true, reserveType: ReserveType.Local, assetId: '' });
      }
    });
  }
  if (targetChain?.id === 1000 && sourceChain?.xcAssetsData) {
    Object.entries(sourceChain?.xcAssetsData)?.forEach(([key, value]) => {
      const dotToken = value?.find(item => item?.symbol?.toLowerCase() === 'dot');
      if (dotToken) {
        tokenList.push(dotToken);
      }
    });
  }
  if (sourceChain?.xcAssetsData && targetChain?.xcAssetsData) {
    // 检查源链是否支持 DOT
    let sourceSupportsDot = false;
    Object.values(sourceChain.xcAssetsData).forEach(value => {
      if (value?.find(item => item?.symbol?.toLowerCase() === 'dot')) {
        sourceSupportsDot = true;
      }
    });

    // 检查目标链是否支持 DOT
    let targetSupportsDot = false;
    Object.values(targetChain.xcAssetsData).forEach(value => {
      if (value?.find(item => item?.symbol?.toLowerCase() === 'dot')) {
        targetSupportsDot = true;
      }
    });

    // 只有当双方都支持 DOT 时才添加到 tokenList
    if (sourceSupportsDot && targetSupportsDot) {
      Object.values(sourceChain.xcAssetsData).forEach(value => {
        const dotToken = value?.find(item => item?.symbol?.toLowerCase() === 'dot');
        if (dotToken) {
          tokenList.push(dotToken);
        }
      });
    }
  }


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
