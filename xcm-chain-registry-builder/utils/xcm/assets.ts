import { ReserveType } from "../../types/enum";
import type { Asset } from "../../types/registry";
import { ChainRegistry, Registry } from "../../types/transformParachains";
import { getGeneralIndex, hasParachainInLocation } from "./location";

export const filterXcmTokensByString = (tokens: any[], allowedParaIds: number[]) => {
    return tokens.filter(token => {
        const tokenString = JSON.stringify(token).toLowerCase();
        if (tokenString.includes('globalconsensus')) {
            return false;
        }
        const hasParachain = /"parachain":\s*\d+/.test(tokenString);
        if (!hasParachain) {
            return true;
        }
        return allowedParaIds.some(paraId =>
            new RegExp(`"parachain":\\s*${paraId}\\b`).test(tokenString)
        );
    });
};


export function findIconBySymbol(symbol: string, assets: Asset[]) {
    const targetSymbol = symbol.toLowerCase();
    const regex = new RegExp(`^([a-z]*${targetSymbol}|${targetSymbol}[a-z]*)$`);
    return (
        assets?.find((asset) => regex.test(asset.symbol?.toLowerCase()))?.icon ||
        '/images/default-token.svg'
    );
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
                return Object.keys(chain.assetsInfo || {}).includes(generalIndex);
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

        return {
            assetId: generalIndex,
            symbol: assetInfo || asset!.symbol,
            decimals: asset!.decimals,
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
            },
            icon: findIconBySymbol(assetInfo || asset!.symbol, assetsInfoArray)
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

export function processAssetHubAssetsWithRegisteredChains(processedAssets: any[], otherChains: any[]) {
    return processedAssets.map(asset => {
        const registeredChains = {};

        otherChains.forEach(chain => {
            const xcAssetsData = chain.xcAssetsData || [];

            const matchedAsset = xcAssetsData.find(xcAsset =>
                xcAsset.symbol.toLowerCase() === asset.symbol.toLowerCase() &&
                hasParachainInLocation({
                    multiLocationStr: xcAsset.xcmV1MultiLocation,
                    paraId: '1000'
                })
            );

            if (matchedAsset) {
                registeredChains[chain.id] = {
                    assetId: matchedAsset.asset,
                    symbol: matchedAsset.symbol,
                    decimals: matchedAsset.decimals,
                    xcmLocation: JSON.parse(matchedAsset.xcmV1MultiLocation),
                    icon: asset.icon,
                    isNative: false,
                    reserveType: ReserveType.Foreign,
                };
            }
        });

        return {
            ...asset,
            registeredChains
        };
    });
}
