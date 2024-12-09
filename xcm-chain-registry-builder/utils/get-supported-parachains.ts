import { BLACKLISTED_PARA_IDS } from "../config";
import { ChainConfig } from "../type";

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
                            !BLACKLISTED_PARA_IDS.includes(Number(asset?.paraID))
                    )
                : undefined
        }))
        ?.filter((v) => {
            return !BLACKLISTED_PARA_IDS.includes(Number(v.id));
        });
}