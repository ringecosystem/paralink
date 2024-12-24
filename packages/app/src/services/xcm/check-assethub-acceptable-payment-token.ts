import { normalizeInterior } from '@/utils/xcm/helper';
import type { ApiPromise } from '@polkadot/api';
import type { Asset } from '@/types/xcm-asset';
type CheckAssetHubAcceptablePaymentTokenParams = {
  api: ApiPromise;
  asset?: Asset;
};
export async function checkAssetHubAcceptablePaymentToken({
  api,
  asset
}: CheckAssetHubAcceptablePaymentTokenParams) {
  if (asset?.symbol)
    try {
      if (!asset?.xcmLocation) {
        console.log('Asset XCM location not found', asset);
        return false;
      }
      // match dot location
      if (asset?.symbol?.toLowerCase() === 'dot') {
        if (
          Number(asset?.xcmLocation?.v1?.parents) === 1 &&
          asset?.xcmLocation?.v1?.interior?.here === null
        ) {
          return true;
        }
      }

      const interiorFlattened = normalizeInterior(
        asset?.xcmLocation?.v1?.interior
      );
      const assetId = Array.isArray(interiorFlattened)
        ? interiorFlattened?.find((item) => item.generalIndex)?.generalIndex
        : null;

      if (!assetId) {
        console.log('Asset ID not found in XCM location', assetId);
        return false;
      }

      const assetIdResult = await api.query.assets.asset(assetId);

      const isSufficient = (
        assetIdResult?.toJSON() as Record<string, string | boolean>
      )?.isSufficient as boolean;

      if (!isSufficient) {
        console.log('Asset is not sufficient for payment', assetId);
      }

      return isSufficient;
    } catch (error) {
      console.log('Failed to check asset hub acceptable payment token', {
        error,
        asset
      });
      return false;
    }
}
