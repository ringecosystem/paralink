import { ReserveType } from '../../types/enum';
import type { Asset } from '../../types/registry';
import { ChainRegistry, Registry } from '../../types/transformParachains';
import { getGeneralIndex, hasParachainInLocation } from './location';

export const filterXcmTokensByString = (
  tokens: any[],
  allowedParaIds: number[]
) => {
  return tokens.filter((token) => {
    const tokenString = JSON.stringify(token).toLowerCase();
    if (tokenString.includes('globalconsensus')) {
      return false;
    }
    const hasParachain = /"parachain":\s*\d+/.test(tokenString);
    if (!hasParachain) {
      return true;
    }
    return allowedParaIds.some((paraId) =>
      new RegExp(`"parachain":\\s*${paraId}\\b`).test(tokenString)
    );
  });
};

export function findNativeAssetBySymbol({ assets, symbol, chainSlug }) {
  const id = `${chainSlug}-NATIVE-${symbol}`;
  return assets?.find((asset) => asset.id?.toLowerCase() === id?.toLowerCase());
}

export function findLocalAssetBySymbol({
  assets,
  chainSlug,
  symbol
}: {
  assets: Asset[];
  chainSlug: string;
  symbol: string;
}) {
  const id = `${chainSlug}-LOCAL-${symbol}`;
  return assets?.find((asset) => asset.id?.toLowerCase() === id?.toLowerCase());
}

export function findIconBySymbol(symbol: string, assets: Asset[]) {
  const targetSymbol = symbol.toLowerCase();
  const regex = new RegExp(`^([a-z]*${targetSymbol}|${targetSymbol}[a-z]*)$`);
  return (
    assets?.find((asset) => regex.test(asset.symbol?.toLowerCase()))?.icon ||
    '/images/default-token.svg'
  );
}

export function getChainByParaId({
  paraId,
  chainRegistry
}: {
  paraId: number;
  chainRegistry: Registry;
}) {
  return chainRegistry?.find((chain) => Number(chain.id) === paraId);
}

export function collectAssetHubAssets(
  filteredChainRegistry: Registry,
  chain: ChainRegistry
): any[] {
  return filteredChainRegistry
    ?.filter((v) => v.id !== '1000')
    ?.flatMap((v) => {
      return (v.xcAssetsData || []).filter((asset) => {
        const hasParachain = hasParachainInLocation({
          multiLocationStr: asset.xcmV1MultiLocation,
          paraId: '1000'
        });
        if (!hasParachain) return false;
        const generalIndex = getGeneralIndex(asset.xcmV1MultiLocation);
        if (!generalIndex) return false;
        return Object.keys(chain.assetsInfo || {}).includes(
          generalIndex.toString()
        );
      });
    });
}

export function deduplicateAssets(
  allAssets: any[],
  chain: Registry[0],
  assetsInfoArray: Asset[]
): any[] {
  return Array.from(
    new Set(allAssets.map((asset) => asset.xcmV1MultiLocation))
  ).map((xcmV1MultiLocation) => {
    const asset = allAssets.find(
      (a) => a.xcmV1MultiLocation === xcmV1MultiLocation
    );

    const generalIndex = getGeneralIndex(asset!.xcmV1MultiLocation);
    const assetInfo = chain.assetsInfo?.[generalIndex || ''];

    const localAsset = findLocalAssetBySymbol({
      assets: assetsInfoArray,
      chainSlug: chain.slug,
      symbol: assetInfo || asset!.symbol
    });

    return {
      assetId: localAsset?.metadata?.assetId || generalIndex,
      symbol: assetInfo || asset!.symbol,
      name: localAsset?.name || assetInfo || asset!.symbol,
      decimals: asset!.decimals,
      icon: localAsset?.icon,
      priceId: localAsset?.priceId,
      minAmount: localAsset?.minAmount,
      reserveType: ReserveType.Local,
      xcmLocation: {
        v1: {
          parents: 0,
          interior: {
            x3: [
              {
                parachain: Number(chain.id)
              },
              { palletInstance: 50 },
              { generalIndex: generalIndex }
            ]
          }
        }
      }
    };
  });
}

export function processAssetHubAssets(
  chain: ChainRegistry,
  filteredChainRegistry: Registry,
  assetsInfoArray: Asset[]
): Asset[] {
  const allAssetHubAssets = collectAssetHubAssets(filteredChainRegistry, chain);
  return deduplicateAssets(allAssetHubAssets, chain, assetsInfoArray);
}

export function processAssetHubAssetsWithRegisteredChains(
  processedAssets: any[],
  currentChain: ChainRegistry,
  otherChains: any[],
  assetsInfoArray: Asset[]
) {
  return processedAssets.map((asset) => {
    const registeredChains = {};

    otherChains.forEach((chain) => {
      const xcAssetsData = chain.xcAssetsData || [];

      const matchedAsset = xcAssetsData.find(
        (xcAsset) =>
          xcAsset.symbol.toLowerCase() === asset.symbol.toLowerCase() &&
          hasParachainInLocation({
            multiLocationStr: xcAsset.xcmV1MultiLocation,
            paraId: '1000'
          })
      );

      if (matchedAsset) {
        const localAsset = findLocalAssetBySymbol({
          assets: assetsInfoArray,
          chainSlug: currentChain.slug,
          symbol: matchedAsset.symbol
        });

        const targetAsset = findLocalAssetBySymbol({
          assets: assetsInfoArray,
          chainSlug: chain.slug,
          symbol: asset.symbol
        });

        registeredChains[chain.id] = {
          assetId: matchedAsset.asset,
          symbol: matchedAsset.symbol,
          name: targetAsset?.name || localAsset?.name || matchedAsset.symbol,
          decimals: matchedAsset.decimals,
          minAmount: targetAsset?.minAmount,
          priceId: targetAsset?.priceId || localAsset?.priceId
        };
      }
    });

    return {
      ...asset,
      registeredChains
    };
  });
}
