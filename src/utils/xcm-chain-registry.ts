import type { ChainInfoWithXcAssetsData } from '@/store/chains';
import type {
  AssetType,
  ReserveType,
  XcAssetData
} from '@/types/asset-registry';

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
    if (chain.id === '1000') return true;

    const hasXcAssets = chain?.xcAssetsData?.some((asset) => {
      const targetParaId = chain.id;
      return !hasParachainInLocation({
        multiLocationStr: asset.xcmV1MultiLocation,
        paraId: targetParaId
      });
    });

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

    return hasXcAssets || isNativeTokenSupported;
  });
}

export function getToChains(
  chains: ChainInfoWithXcAssetsData[],
  fromChainId: string
): ChainInfoWithXcAssetsData[] {
  const fromChain = chains.find((chain) => chain.id === fromChainId);
  if (!fromChain) return [];

  const filteredChains = chains.filter((chain) => chain.id !== fromChainId);

  if (fromChain.id === '1000') {
    return filteredChains.filter((chain) => {
      const hasValidXcAsset = chain.xcAssetsData?.some((asset) => {
        const hasParachain = hasParachainInLocation({
          multiLocationStr: asset.xcmV1MultiLocation,
          paraId: fromChain.id
        });

        if (!hasParachain) return false;

        const generalIndex = getGeneralIndex(asset.xcmV1MultiLocation);
        if (!generalIndex) return false;

        return Object.keys(fromChain.assetsInfo || {}).includes(generalIndex);
      });

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

  return filteredChains.filter((chain) => {
    const supportsNativeToken = chain.xcAssetsData?.some(
      (asset) =>
        hasParachainInLocation({
          multiLocationStr: asset.xcmV1MultiLocation,
          paraId: fromChain.id
        }) &&
        asset.symbol.toLowerCase() ===
          fromChain.nativeToken.symbol.toLowerCase()
    );
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
          reserveType: 'foreign',
          xcmV1MultiLocation: foreignAsset.multiLocation || '',
          asset: { ForeignAsset: assetId },
          assetHubReserveLocation: foreignAsset.assetHubReserveLocation,
          originChainReserveLocation: foreignAsset.originChainReserveLocation
        };
        tokenList.push(foreignAssetInfo);
      }
    }
    const destAssetsInfo = toChain?.xcAssetsData?.filter((asset) => {
      const hasParachain = hasParachainInLocation({
        multiLocationStr: asset.xcmV1MultiLocation,
        paraId: fromChain.id
      });

      if (!hasParachain) return false;

      if (
        foreignAssetInfo &&
        foreignAssetInfo.symbol.toLowerCase() === asset.symbol.toLowerCase()
      ) {
        return false;
      }

      const generalIndex = getGeneralIndex(asset.xcmV1MultiLocation);
      if (!generalIndex) return false;

      return Object.keys(fromChain.assetsInfo || {}).includes(generalIndex);
    });

    if (destAssetsInfo && destAssetsInfo.length > 0) {
      const processedAssets = destAssetsInfo.map((asset) => {
        const generalIndex = getGeneralIndex(asset.xcmV1MultiLocation);
        const assetInfo = fromChain.assetsInfo?.[generalIndex || ''];

        return {
          ...asset,
          symbol: assetInfo || asset.symbol,
          decimals: asset.decimals,
          paraID: Number(fromChain.id),
          nativeChainID: fromChain.name.toLowerCase().replace(/\s/g, '-'),
          reserveType: 'local' as ReserveType,
          asset: generalIndex as AssetType,
          xcmV1MultiLocation: JSON.stringify({
            v1: {
              parents: 1,
              interior: {
                x3: [
                  { parachain: fromChain.id },
                  { palletInstance: 50 },
                  { generalIndex }
                ]
              }
            }
          })
        };
      });
      tokenList.push(...processedAssets);
    }
  } else {
    let supportedNativeToken = toChain.xcAssetsData?.find(
      (asset) =>
        hasParachainInLocation({
          multiLocationStr: asset.xcmV1MultiLocation,
          paraId: fromChain.id
        }) &&
        asset.symbol.toLowerCase() ===
          fromChain.nativeToken.symbol.toLowerCase()
    );

    supportedNativeToken = {
      ...supportedNativeToken,
      symbol: supportedNativeToken?.symbol || '',
      decimals: supportedNativeToken?.decimals || 0,
      paraID: Number(fromChain.id),
      nativeChainID: fromChain.name.toLowerCase().replace(/\s/g, '-'),
      reserveType: 'local' as ReserveType,
      asset: 'Native' as AssetType,
      xcmV1MultiLocation: JSON.stringify({
        v1: {
          parents: 1,
          interior: {
            x1: { parachain: fromChain.id }
          }
        }
      })
    };

    const otherAssets =
      fromChain.xcAssetsData
        ?.filter((asset) => {
          const hasDestParachain = hasParachainInLocation({
            multiLocationStr: asset.xcmV1MultiLocation,
            paraId: toChain.id
          });

          if (
            supportedNativeToken &&
            asset.symbol.toLowerCase() ===
              fromChain.nativeToken.symbol.toLowerCase()
          ) {
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
        })
        ?.map((v) => ({
          ...v,
          reserveType: 'foreign' as ReserveType
        })) ?? [];

    return supportedNativeToken
      ? [supportedNativeToken, ...otherAssets]
      : otherAssets;
  }

  return tokenList;
};

// clover
