import { flattenXcmInterior } from '@/utils/xcm/helper';
import type { ApiPromise } from '@polkadot/api';
import type { XcAssetData } from '@/types/asset-registry';
type CheckAssetHubAcceptablePaymentTokenParams = {
  api: ApiPromise;
  asset?: XcAssetData;
};
export async function checkAssetHubAcceptablePaymentToken({
  api,
  asset
}: CheckAssetHubAcceptablePaymentTokenParams) {
  try {
    if (!asset?.xcmV1MultiLocation) {
      console.log('Asset XCM location not found', asset);
      return false;
    }
    const interiorFlattened = flattenXcmInterior(asset?.xcmV1MultiLocation);
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
