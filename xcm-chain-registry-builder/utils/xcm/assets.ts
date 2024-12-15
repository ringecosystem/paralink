import type { Asset } from "../../types/registry";

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
