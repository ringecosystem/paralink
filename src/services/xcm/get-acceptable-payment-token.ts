import type { ApiPromise } from '@polkadot/api';
import type { MultiLocation } from '@polkadot/types/interfaces/xcm';

type GetCrossTokenParams = {
  api: ApiPromise;
};

export interface XcmV3MultiLocation {
  v3?: {
    concrete?: MultiLocation;
  };
}

interface XcmResponse {
  ok?: XcmV3MultiLocation[];
}

export async function getAcceptablePaymentTokens({
  api
}: GetCrossTokenParams): Promise<XcmV3MultiLocation[]> {
  const tokenXcm = await api.call.xcmPaymentApi.queryAcceptablePaymentAssets(3);
  const xcmTokens = tokenXcm.toJSON() as XcmResponse;
  const tokens = xcmTokens?.ok || [];
  return tokens;
}
