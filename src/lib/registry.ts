import { BLACKLISTED_PARA_IDS } from '@/config/token';
import type { ChainConfig, XcAssetData } from '@/types/asset-registry';
import type { Asset } from '@/types/assets-info';

interface ParachainAsset {
  paraID: number;
  symbol: string;
  decimals: number;
  nativeChainID: string | null;
  xcmV1MultiLocation: string;
  asset: string | { ForeignAsset: string };
  assetHubReserveLocation: string;
  originChainReserveLocation: string;
}

export interface ParachainInfo {
  id: string;
  name: string;
  tokens: string[];
  xcAssetsData?: ParachainAsset[];
}

export function findIconBySymbol(symbol: string, assets: Asset[]) {
  return (
    assets?.find((asset) => {
      const assetSymbol = asset.symbol?.toLowerCase();
      const targetSymbol = symbol.toLowerCase();
      const isMatch =
        assetSymbol === targetSymbol ||
        assetSymbol === `ah${targetSymbol}` ||
        assetSymbol === `${targetSymbol}ah` ||
        targetSymbol === `ah${assetSymbol}` ||
        targetSymbol === `${assetSymbol}ah` ||
        assetSymbol === `w${targetSymbol}` ||
        assetSymbol === `${targetSymbol}w` ||
        targetSymbol === `w${assetSymbol}` ||
        targetSymbol === `${assetSymbol}w` ||
        targetSymbol === `v${assetSymbol}` ||
        targetSymbol === `${assetSymbol}v`;
      return isMatch;
    })?.icon || '/images/default-token.svg'
  );
}

export function getSupportedParaChains(polkadot: ChainConfig) {
  return Object.entries(polkadot)
    ?.map(([id, data]) => ({
      id,
      ...data,
      xcAssetsData: data.xcAssetsData
        ? data.xcAssetsData
            ?.map((asset) => {
              if (!asset.paraID && asset.originChainReserveLocation) {
                try {
                  const reserveLocation = JSON.parse(
                    asset.originChainReserveLocation
                  );
                  const paraID = reserveLocation?.interior?.X1?.Parachain;
                  return { ...asset, paraID: Number(paraID) || 0 };
                } catch {
                  return asset;
                }
              }
              return asset;
            })
            .filter(
              (asset) =>
                !BLACKLISTED_PARA_IDS.includes(asset?.paraID?.toString())
            )
        : undefined
    }))
    ?.filter((v) => {
      // blacklist
      return !BLACKLISTED_PARA_IDS.includes(v.id);
    });
}

// export function getDestinationParaChains(
//   chains: ChainInfoWithXcAssetsData[],
//   sourceParaId: string
// ) {
//   if (!chains?.length) return [];
//   const sourceChain = chains?.find((v) => v.id === sourceParaId) as
//     | ChainInfoWithXcAssetsData
//     | undefined;
//   if (!sourceChain) return [];

//   const destParaIds = new Set(
//     sourceChain?.xcAssetsData?.map((x) => x.paraID?.toString()) ?? []
//   );
//   return chains.filter((v) => destParaIds.has(v.id));
// }

export interface XcAssetWithMatch extends XcAssetData {
  icon?: string;
  name?: string;
}

export function getTokenFromXcAsset({
  xcAssetData,
  assets
}: {
  xcAssetData: XcAssetData;
  assets: Asset[];
}): XcAssetWithMatch {
  const { nativeChainID, symbol } = xcAssetData;

  const possibleSlugs = [
    `${nativeChainID}-NATIVE-${symbol}`,
    `${nativeChainID}-LOCAL-${symbol}`,
    `${nativeChainID}-LOCAL-ah${symbol}`,
    `${nativeChainID}-LOCAL-${symbol}ah`,
    `${nativeChainID}-ERC20-${symbol}`,
    `${nativeChainID}-LOCAL-W${symbol}`,
    `${nativeChainID}-LOCAL-${symbol}W`,
    `${nativeChainID}-native-${symbol.toLowerCase()}`,
    `${nativeChainID}-local-${symbol.toLowerCase()}`,
    `${nativeChainID}-local-v${symbol.toLowerCase()}`,
    `${nativeChainID}-local-${symbol.toLowerCase()}v`
  ];

  const slugMatch = assets?.find((asset) =>
    possibleSlugs.some(
      (slug) => asset.slug?.toLowerCase() === slug.toLowerCase()
    )
  );

  if (slugMatch) {
    return {
      ...xcAssetData,
      name: slugMatch.name,
      icon: slugMatch.icon ?? undefined
    };
  }

  const exactSymbolMatch = assets?.find(
    (asset) => asset.symbol?.toLowerCase() === symbol.toLowerCase()
  );

  const prefixSymbolMatch = assets?.find((asset) => {
    const assetSymbol = asset.symbol?.toLowerCase();
    const targetSymbol = symbol.toLowerCase();
    return (
      assetSymbol === `ah${targetSymbol}` ||
      assetSymbol === `${targetSymbol}ah` ||
      assetSymbol === `w${targetSymbol}` ||
      assetSymbol === `${targetSymbol}w`
    );
  });

  const bestMatch = exactSymbolMatch || prefixSymbolMatch || slugMatch;

  console.log('没吃过啊', bestMatch?.icon, findIconBySymbol(symbol, assets));

  return {
    ...xcAssetData,
    name: bestMatch?.name ?? undefined,
    icon: bestMatch?.icon ?? findIconBySymbol(symbol, assets) ?? undefined
  };
}
