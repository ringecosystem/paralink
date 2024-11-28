import { ApiPromise } from '@polkadot/api';
import { XcmV3MultiLocation } from './check-acceptable-payment-token';

interface WeightV2Weight {
  refTime: bigint;
  proofSize: bigint;
}

type QueryWeightToAssetFeeParams = {
  api: ApiPromise;
  weight: WeightV2Weight;
  asset: XcmV3MultiLocation;
};
export async function queryWeightToAssetFee({
  api,
  weight,
  asset
}: QueryWeightToAssetFeeParams): Promise<bigint> {
  if (!weight || !asset)
    throw new Error('Weight and asset parameters are required');

  return api.call.xcmPaymentApi.queryWeightToAssetFee(weight, asset);
}
