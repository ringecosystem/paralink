import { ReserveType, type Asset, type ChainConfig } from '@/types/xcm-asset';
import { isDotLocation, normalizeInterior } from './helper';
import { TOKEN_BLACKLIST } from '@/config/blacklist';
import { isEqual } from 'lodash-es';

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


function filterBlacklistedTokens(tokenList: Asset[]): Asset[] {

  return tokenList.filter(token => {
    const tokenInterior = normalizeInterior(token.xcmLocation?.v1?.interior)
    if (!tokenInterior || !Array.isArray(tokenInterior)) {
      return true;
    }

    const isBlacklisted = TOKEN_BLACKLIST.some(blacklistLocation => {
      return isEqual(
        tokenInterior,
        blacklistLocation
      )
    }
    );
    if (isBlacklisted) {
      console.log('blacklisted token', token);
    }
    return !isBlacklisted;
  });
}



export const getTokenList = ({
  sourceChain,
  targetChain
}: {
  sourceChain: ChainConfig;
  targetChain: ChainConfig;
}) => {
  // TOKEN_BLACKLIST
  const tokenList: Asset[] = [];
  const targetChainId = targetChain?.id;

  // get dot token
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
    console.log('sourceChain', sourceChain);
    const sourceDot = findDotToken(sourceChain);
    console.log('sourceDot', sourceDot);
    if (sourceDot) tokenList.push(sourceDot);
  } else {
    const sourceDot = findDotToken(sourceChain);
    const targetDot = findDotToken(targetChain);
    if (sourceDot && targetDot) {
      tokenList.push(sourceDot);
    }
  }

  // by native token
  if (sourceChain?.nativeToken?.registeredChains) {
    // filter by target chain id
    const nativeTokenInTargetChain = sourceChain?.nativeToken?.registeredChains?.[targetChainId];
    if (nativeTokenInTargetChain) {
      tokenList.push({
        ...sourceChain?.nativeToken,
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
        },
        targetXcmLocation: nativeTokenInTargetChain?.xcmLocation
      });
    }
  }

  // by local assets
  if (sourceChain?.localAssets) {
    const localAssets = sourceChain?.localAssets?.filter(v => v.registeredChains?.[targetChainId]);
    if (localAssets?.length) {
      tokenList.push(...localAssets?.map(v => ({
        ...v,
        targetXcmLocation: v.registeredChains?.[targetChainId]?.xcmLocation
      })));
    }
  }

  if (sourceChain?.xcAssetsData) {
    const targetChainAssets = sourceChain?.xcAssetsData?.[targetChainId];
    if (targetChainAssets?.length) {
      tokenList.push(...targetChainAssets);
    }
  }




  return filterBlacklistedTokens(tokenList);
};
