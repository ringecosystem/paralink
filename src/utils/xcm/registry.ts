import { ReserveType, type Asset, type ChainConfig } from '@/types/xcm-asset';
import { isDotLocation } from './helper';

export function getFromChains(chains: ChainConfig[]): ChainConfig[] {
  return chains;
}

export function getToChains(
  chains: ChainConfig[],
  sourceChainId: number
): ChainConfig[] {
  return chains?.filter((chain) => chain.id !== sourceChainId);
}

function findDotToken(chain: ChainConfig): Asset | null {
  if (chain.id === 1000) {
    return {
      ...chain.nativeToken,
      assetId: 'Native',
      isNative: true,
      reserveType: ReserveType.Local,
      xcmLocation: {
        v1: {
          parents: 1,
          interior: {
            here: null
          }
        }
      }
    };
  }

  for (const assets of Object.values(chain.xcAssetsData || {})) {
    const dotToken = assets?.find((asset) => isDotLocation(asset.xcmLocation));

    if (dotToken) return dotToken;
  }
  return null;
}

export const getTokenList = ({
  sourceChain,
  targetChain
}: {
  sourceChain: ChainConfig;
  targetChain: ChainConfig;
}) => {
  const tokenList: Asset[] = [];

  if (sourceChain.id === 1000) {
    const targetDot = findDotToken(targetChain);
    if (targetDot) {
      tokenList.push({
        ...targetDot,
        isNative: true,
        assetId: 'Native',
        reserveType: ReserveType.Local
      });
    }
  } else if (targetChain.id === 1000) {
    const sourceDot = findDotToken(sourceChain);
    if (sourceDot) tokenList.push(sourceDot);
  } else {
    const sourceDot = findDotToken(sourceChain);
    const targetDot = findDotToken(targetChain);
    if (sourceDot && targetDot) {
      tokenList.push(sourceDot);
    }
  }

  const targetChainId = targetChain?.id;
  if (sourceChain.id === 1000) {
    const tokens = sourceChain?.localAssets?.[targetChainId];
    if (tokens) {
      tokenList.push(...tokens);
    }
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
  }
  return tokenList;
};
