import { BLACKLISTED_PARA_IDS } from '../config';
import { ChainConfig } from '../type';

export function getSupportedParaChains(polkadot: ChainConfig) {
  return Object.entries(polkadot)
    ?.map(([id, data]) => ({
      id,
      ...data,
      xcAssetsData: data.xcAssetsData
        ? data.xcAssetsData.filter(
            (asset) =>
              !asset?.paraID ||
              !BLACKLISTED_PARA_IDS.includes(Number(asset?.paraID))
          )
        : undefined
    }))
    ?.filter((v) => {
      return !BLACKLISTED_PARA_IDS.includes(Number(v.id));
    });
}
