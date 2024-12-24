import { BLACKLISTED_PARA_IDS } from '../../config';
import type { ChainConfig } from '../../types/registry';

export function getSupportedParaChains(polkadot: ChainConfig) {
  return Object.entries(polkadot)
    ?.map(([paraId, data]) => {
      const { id, ...restData } = data;
      console.log('paraId', id);
      return {
        id: paraId,
        ...restData,
        xcAssetsData: data.xcAssetsData
          ? data.xcAssetsData.filter(
              (asset) =>
                !asset?.paraID ||
                !BLACKLISTED_PARA_IDS.includes(Number(asset?.paraID))
            )
          : undefined
      };
    })
    ?.filter((v) => !BLACKLISTED_PARA_IDS.includes(Number(v.id)));
}
