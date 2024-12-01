import { parseAndNormalizeXcm } from '@/utils/xcm-location';
import type { ApiPromise } from '@polkadot/api';
import type { XcAssetData } from '@/types/asset-registry';

type CheckAssetHubAcceptablePaymentTokenParams = {
  api: ApiPromise;
  asset: XcAssetData;
};
export async function checkAssetHubAcceptablePaymentToken({
  api,
  asset
}: CheckAssetHubAcceptablePaymentTokenParams) {
  try {
    if (!asset?.xcmV1MultiLocation) {
      console.log('Asset XCM location is missing or invalid');
      return false;
    }

    const multiLocation = JSON.parse(asset.xcmV1MultiLocation);
    const location = parseAndNormalizeXcm(multiLocation);

    if (!location) {
      console.log('Failed to parse XCM location', { multiLocation });
      return false;
    }

    const { interior } = location;
    let assetId;
    if (Array.isArray(interior)) {
      assetId = interior?.find((item) => item.GeneralIndex)?.GeneralIndex;
    } else {
      assetId = interior?.GeneralIndex;
    }

    if (!assetId) {
      console.log('Asset ID not found in XCM location', asset);
      return false;
    }

    const assetIdResult = await api.query.assets.asset(assetId);

    const isSufficient = (
      assetIdResult?.toJSON() as Record<string, string | boolean>
    )?.isSufficient as boolean;

    if (!isSufficient) {
      console.log('Asset is not sufficient for payment', asset);
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
