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