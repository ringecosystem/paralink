import { XcAssetData } from '@/types/asset-registry';
import { isXcmLocationMatch } from '@/utils/xcm';
import { ApiPromise } from '@polkadot/api';
import { MultiLocation } from '@polkadot/types/interfaces/xcm';

type GetCrossTokenParams = {
  api: ApiPromise;
  asset: XcAssetData;
};

export interface XcmV3MultiLocation {
  V3?: {
    Concrete?: MultiLocation;
  };
}

interface XcmResponse {
  Ok?: XcmV3MultiLocation[];
}

export async function checkAcceptablePaymentToken({
  api,
  asset
}: GetCrossTokenParams): Promise<boolean> {
  const tokenXcm = await api.call.xcmPaymentApi.queryAcceptablePaymentAssets(3);
  const xcmTokens = tokenXcm.toHuman() as XcmResponse;
  const tokens = xcmTokens?.Ok || [];

  for (let index = 0; index < tokens.length; index++) {
    const tokenInfo = tokens[index];
    const isMatch = isXcmLocationMatch(
      tokenInfo?.V3?.Concrete,
      JSON.parse(asset.xcmV1MultiLocation)?.v1
    );
    return isMatch;
  }
  return false;
}
