import type { Asset } from "../type";

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