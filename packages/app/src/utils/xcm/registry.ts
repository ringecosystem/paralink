import { ReserveType, type Asset, type ChainConfig } from '@/types/xcm-asset';
import { normalizeInterior } from './helper';
import { TOKEN_BLACKLIST } from '@/config/blacklist';
import { isEqual } from 'lodash-es';
import { getAvailableAssets } from '@/services/xcm/moonbean';

export function getFromChains(chains: ChainConfig[]): ChainConfig[] {
  return chains;
}

export function getToChains(
  chains: ChainConfig[],
  sourceChainId: number
): ChainConfig[] {
  return chains?.filter((chain) => chain.id !== sourceChainId);
}

function filterBlacklistedTokens(tokenList: Asset[]): Asset[] {
  return tokenList.filter((token) => {
    const tokenInterior = normalizeInterior(token.xcmLocation?.v1?.interior);
    if (!tokenInterior || !Array.isArray(tokenInterior)) {
      return true;
    }

    const isBlacklisted = TOKEN_BLACKLIST.some((blacklistLocation) => {
      return isEqual(tokenInterior, blacklistLocation);
    });
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
  const tokenList: Asset[] = [];
  const targetChainId = targetChain?.id;

  // by native token
  if (sourceChain?.nativeToken?.registeredChains) {
    // filter by target chain id
    const nativeTokenInTargetChain =
      sourceChain?.nativeToken?.registeredChains?.[targetChainId];

    if (nativeTokenInTargetChain) {
      tokenList.push({
        ...sourceChain?.nativeToken,
        assetId: 'Native',
        isNative: true,
        reserveType: ReserveType.Local,
        xcmLocation: nativeTokenInTargetChain?.xcmLocation,
        targetXcmLocation: nativeTokenInTargetChain?.xcmLocation
      });
    }
  }

  if (sourceChain.id === 1000 && targetChain.id === 0) {
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
      targetXcmLocation: {
        v1: {
          parents: 1,
          interior: {
            here: null
          }
        }
      }
    });
  }

  // by local assets
  if (sourceChain?.localAssets) {
    const localAssets = sourceChain?.localAssets?.filter(
      (v) => v.registeredChains?.[targetChainId]
    );
    if (localAssets?.length) {
      tokenList.push(
        ...localAssets?.map((v) => ({
          ...v
        }))
      );
    }
  }

  if (sourceChain?.xcAssetsData) {
    const targetChainAssets = sourceChain?.xcAssetsData?.[targetChainId];
    if (targetChainAssets?.length) {
      tokenList.push(...targetChainAssets);
    }
  }

  const filterAssets = filterBlacklistedTokens(tokenList);
  if (sourceChain.id === 2004) {
    const availableAssets = getAvailableAssets(sourceChain.id, targetChain.id);
    console.log('availableAssets', availableAssets);
    return filterAssets?.filter((asset) =>
      availableAssets?.some((v) => v.symbol === asset.symbol)
    );
  }
  return filterAssets;
};
