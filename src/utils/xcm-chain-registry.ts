import type { ChainInfoWithXcAssetsData } from '@/store/chains';
import type { XcAssetData } from '@/types/asset-registry';

export function hasParachainInLocation({
  multiLocationStr,
  paraId
}: {
  multiLocationStr: string;
  paraId: string;
}): boolean {
  try {
    const multiLocation = JSON.parse(multiLocationStr);
    const interior = multiLocation.v1.interior;
    const locationArray = interior.x1 || interior.x2 || interior.x3 || [];
    // 处理数组和单个对象的情况
    return Array.isArray(locationArray)
      ? locationArray.some(
          (v: { [key: string]: string | number }) =>
            'parachain' in v && v.parachain?.toString() === paraId
        )
      : 'parachain' in locationArray &&
          locationArray.parachain?.toString() === paraId;
  } catch (error) {
    console.error('Error parsing multiLocation:', error);
    return false;
  }
}

export function matchesParachainAndSymbol({
  multiLocationStr,
  paraId,
  symbol,
  targetSymbol
}: {
  multiLocationStr: string;
  paraId: string;
  symbol: string;
  targetSymbol: string;
}): boolean {
  try {
    const multiLocation = JSON.parse(multiLocationStr);
    const interior = multiLocation.interior;

    const matchesParachain =
      interior?.X1?.Parachain?.toString() === paraId ||
      interior?.X2?.[0]?.Parachain?.toString() === paraId;

    const matchesSymbol = symbol.toLowerCase() === targetSymbol.toLowerCase();

    return matchesParachain && matchesSymbol;
  } catch (error) {
    console.error('Error parsing multiLocation:', error);
    return false;
  }
}

export function getGeneralIndex(multiLocationStr: string): string | null {
  try {
    const multiLocation = JSON.parse(multiLocationStr);
    const interior = multiLocation.v1?.interior;
    const locationArray = interior.x1 || interior.x2 || interior.x3 || [];

    const generalIndexObj = Array.isArray(locationArray)
      ? locationArray.find(
          (v: { [key: string]: string | number }) => 'generalIndex' in v
        )
      : 'generalIndex' in locationArray
        ? locationArray
        : null;

    return generalIndexObj?.generalIndex?.toString() || null;
  } catch (error) {
    console.error('Error parsing multiLocation for generalIndex:', error);
    return null;
  }
}

export function getFromChains(
  chains: ChainInfoWithXcAssetsData[]
): ChainInfoWithXcAssetsData[] {
  return chains.filter((chain) => {
    // AssetHub (Statemint) 总是可以作为来源链
    if (chain.id === '1000') return true;

    // 检查该链是否有指向其他链的 xcAssetsData
    const hasXcAssets = chain?.xcAssetsData?.some((asset) => {
      const targetParaId = chain.id;
      // 确保资产不是指向自身的
      return !hasParachainInLocation({
        multiLocationStr: asset.xcmV1MultiLocation,
        paraId: targetParaId
      });
    });

    // 检查其他链是否支持该链的原生代币
    const isNativeTokenSupported = chains.some((otherChain) =>
      otherChain.xcAssetsData?.some(
        (asset) =>
          hasParachainInLocation({
            multiLocationStr: asset.xcmV1MultiLocation,
            paraId: chain.id
          }) &&
          asset.symbol.toLowerCase() === chain.nativeToken.symbol.toLowerCase()
      )
    );

    // 如果链有 xcAssets 或其原生代币被其他链支持，则可以作为来源链
    return hasXcAssets || isNativeTokenSupported;
  });
}

// 获取目标链列表
export function getToChains(
  chains: ChainInfoWithXcAssetsData[],
  fromChainId: string
): ChainInfoWithXcAssetsData[] {
  const fromChain = chains.find((chain) => chain.id === fromChainId);
  if (!fromChain) return [];

  // 首先过滤掉来源链自身
  const filteredChains = chains.filter((chain) => chain.id !== fromChainId);

  // AssetHub (Statemint) 的特殊处理
  if (fromChain.id === '1000') {
    return filteredChains.filter((chain) => {
      // 检查目标链是否支持来自 AssetHub 的资产
      const hasValidXcAsset = chain.xcAssetsData?.some((asset) => {
        const hasParachain = hasParachainInLocation({
          multiLocationStr: asset.xcmV1MultiLocation,
          paraId: fromChain.id
        });

        if (!hasParachain) return false;

        // 检查generalIndex是否与assetsInfo中的资产匹配
        const generalIndex = getGeneralIndex(asset.xcmV1MultiLocation);
        if (!generalIndex) return false;

        // 确保在AssetHub的assetsInfo中存在对应的资产
        return Object.keys(fromChain.assetsInfo || {}).includes(generalIndex);
      });

      // 检查 AssetHub 是否有目标链的外部资产
      const hasForeignAsset = fromChain.foreignAssetsInfo
        ? Object.entries(fromChain.foreignAssetsInfo).some(([, asset]) =>
            matchesParachainAndSymbol({
              multiLocationStr: asset.multiLocation,
              paraId: chain?.substrateInfo?.paraId?.toString() || '',
              symbol: asset?.symbol || '',
              targetSymbol: chain?.nativeToken?.symbol || ''
            })
          )
        : false;

      return hasValidXcAsset || hasForeignAsset;
    });
  }

  // 对于其他链的处理保持不变
  return filteredChains.filter((chain) => {
    // 检查目标链是否支持源链的原生代币
    const supportsNativeToken = chain.xcAssetsData?.some(
      (asset) =>
        hasParachainInLocation({
          multiLocationStr: asset.xcmV1MultiLocation,
          paraId: fromChain.id
        }) &&
        asset.symbol.toLowerCase() ===
          fromChain.nativeToken.symbol.toLowerCase()
    );

    // 检查源链是否有可以转到目标链的资产
    const hasTransferableAssets = fromChain.xcAssetsData?.some((asset) =>
      hasParachainInLocation({
        multiLocationStr: asset.xcmV1MultiLocation,
        paraId: chain.id
      })
    );

    return supportsNativeToken || hasTransferableAssets;
  });
}

export const getTokenList = ({
  fromChain,
  toChain
}: {
  fromChain: ChainInfoWithXcAssetsData;
  toChain: ChainInfoWithXcAssetsData;
}) => {
  console.log('fromChain', fromChain);
  console.log('toChain', toChain);

  const tokenList: XcAssetData[] = [];
  if (fromChain.id === '1000') {
    let foreignAssetInfo: XcAssetData | undefined;
    if (fromChain?.foreignAssetsInfo) {
      const foreignAssetsEntries = Object.entries(fromChain.foreignAssetsInfo);

      const [assetId, foreignAsset] =
        foreignAssetsEntries.find(([, asset]) => {
          return matchesParachainAndSymbol({
            multiLocationStr: asset.multiLocation,
            paraId: toChain?.substrateInfo?.paraId?.toString() || '',
            symbol: asset?.symbol || '',
            targetSymbol: toChain?.nativeToken?.symbol || ''
          });
        }) || [];

      if (foreignAsset && assetId) {
        foreignAssetInfo = {
          symbol: toChain.nativeToken.symbol,
          decimals: toChain.nativeToken.decimals,
          paraID: Number(toChain.id),
          nativeChainID: toChain.name.toLowerCase().replace(/\s/g, '-'),
          xcmV1MultiLocation: foreignAsset.multiLocation || '',
          asset: { ForeignAsset: assetId },
          assetHubReserveLocation: foreignAsset.assetHubReserveLocation,
          originChainReserveLocation: foreignAsset.originChainReserveLocation
        };
        tokenList.push(foreignAssetInfo);
      }
    }
    // 根据 toChain 的 xcAssetsData 过滤
    const destAssetsInfo = toChain?.xcAssetsData?.filter((asset) => {
      const hasParachain = hasParachainInLocation({
        multiLocationStr: asset.xcmV1MultiLocation,
        paraId: fromChain.id
      });

      if (!hasParachain) return false;

      // 如果有foreignAssetInfo，检查symbol不重复
      if (
        foreignAssetInfo &&
        foreignAssetInfo.symbol.toLowerCase() === asset.symbol.toLowerCase()
      ) {
        return false;
      }

      // 检查generalIndex是否与assetsInfo中的资产匹配
      const generalIndex = getGeneralIndex(asset.xcmV1MultiLocation);
      if (!generalIndex) return false;

      // 确保在fromChain的assetsInfo中存在对应的资产
      return Object.keys(fromChain.assetsInfo || {}).includes(generalIndex);
    });

    if (destAssetsInfo && destAssetsInfo.length > 0) {
      tokenList.push(...destAssetsInfo);
    }
  } else {
    // 1. 检查目标链是否支持源链的原生代币
    let supportedNativeToken = toChain.xcAssetsData?.find(
      (asset) =>
        hasParachainInLocation({
          multiLocationStr: asset.xcmV1MultiLocation,
          paraId: fromChain.id
        }) &&
        asset.symbol.toLowerCase() ===
          fromChain.nativeToken.symbol.toLowerCase()
    );

    // 2. 获取源链上可以转到目标链的资产
    const otherAssets =
      fromChain.xcAssetsData?.filter((asset) => {
        const hasDestParachain = hasParachainInLocation({
          multiLocationStr: asset.xcmV1MultiLocation,
          paraId: toChain.id
        });

        if (
          supportedNativeToken &&
          asset.symbol.toLowerCase() ===
            fromChain.nativeToken.symbol.toLowerCase()
        ) {
          // 只在找到 supportedNativeToken 的情况下修正它并移除原生代币
          supportedNativeToken = {
            ...supportedNativeToken,
            paraID: Number(fromChain.id),
            nativeChainID: fromChain.name.toLowerCase().replace(/\s/g, '-'),
            decimals: asset.decimals,
            originChainReserveLocation: asset.originChainReserveLocation
          };
          return false;
        }

        return hasDestParachain;
      }) ?? [];

    return supportedNativeToken
      ? [supportedNativeToken, ...otherAssets]
      : otherAssets;
  }

  return tokenList;
};
