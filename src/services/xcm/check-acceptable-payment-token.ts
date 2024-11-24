import { XcAssetData } from '@/types/asset-registry';
import { isXcmLocationMatch } from '@/utils/xcm';
import { ApiPromise } from '@polkadot/api';
import { MultiLocation } from '@polkadot/types/interfaces/xcm';

type GetCrossTokenParams = {
  api: ApiPromise;
  token: XcAssetData;
};

// 定义 XCM V3 相关的类型
export interface XcmV3MultiLocation {
  V3?: {
    Concrete?: MultiLocation;
  };
}
interface CheckAcceptableTokenResult {
  original: XcmV3MultiLocation | null;
  acceptableToken: XcAssetData | null;
  isAcceptable: boolean;
}

// 定义 API 返回的响应类型
interface XcmResponse {
  Ok?: XcmV3MultiLocation[];
}

export async function checkAcceptablePaymentToken({
  api,
  token
}: GetCrossTokenParams): Promise<CheckAcceptableTokenResult> {
  const tokenXcm = await api.call.xcmPaymentApi.queryAcceptablePaymentAssets(3);
  const xcmTokens = tokenXcm.toHuman() as XcmResponse;
  const tokens = xcmTokens?.Ok || [];

  for (let index = 0; index < tokens.length; index++) {
    const tokenInfo = tokens[index];
    const isMatch = isXcmLocationMatch(
      tokenInfo?.V3?.Concrete,
      JSON.parse(token.xcmV1MultiLocation)?.v1
    );
    if (isMatch) {
      return {
        original: tokens[index],
        acceptableToken: token,
        isAcceptable: true
      };
    }
  }

  return {
    original: null,
    acceptableToken: null,
    isAcceptable: false
  };
}
