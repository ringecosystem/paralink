import { decodeAddress } from '@polkadot/util-crypto';
import { BN_ZERO, bnToBn, u8aToHex } from '@polkadot/util';
import {
  createStandardXcmInterior,
  parseAndNormalizeXcm
} from '@/utils/xcm-location';
import { parseUnits } from '@/utils/format';
import type { XcAssetData } from '@/types/asset-registry';
import type { ApiPromise } from '@polkadot/api';

type XcmTransferParams = {
  asset: XcAssetData;
  recipientAddress: string;
  isEvmChain: boolean;
};

export function generateDestReserveXcmMessage({
  asset,
  recipientAddress,
  isEvmChain
}: XcmTransferParams) {
  if (!asset.xcmV1MultiLocation) return null;
  try {
    const multiLocation = JSON.parse(asset.xcmV1MultiLocation);

    const location = parseAndNormalizeXcm(multiLocation);
    if (!location) return null;

    const assetId = {
      id: {
        Concrete: {
          parents: 1,
          interior: createStandardXcmInterior({
            interior: location?.interior
          })
        }
      },
      fun: {
        Fungible: parseUnits({
          value: '1',
          decimals: asset.decimals
        })?.toString()
      }
    };

    const beneficiary = {
      parents: 0,
      interior: {
        X1: isEvmChain
          ? {
              AccountKey20: {
                network: null,
                key: recipientAddress
              }
            }
          : {
              AccountId32: {
                network: null,
                id: u8aToHex(decodeAddress(recipientAddress))
              }
            }
      }
    };
    return {
      V3: [
        { WithdrawAsset: [assetId] },
        { ClearOrigin: null },
        {
          BuyExecution: {
            fees: assetId,
            weightLimit: 'Unlimited'
          }
        },
        {
          DepositAsset: {
            assets: { Wild: 'All' },
            beneficiary
          }
        }
      ]
    };
  } catch (error) {
    console.log('error', error);
  }
}

interface QueryDeliveryFeesParams {
  api: ApiPromise;
  asset: XcAssetData;
  recipientAddress: string;
  toParaId: string;
}

/**
 * Query XCM transfer fees
 * @param params Contains api instance, asset info, and target parachain ID
 * @returns The transfer fee
 */
export async function queryDeliveryFees({
  api,
  asset,
  recipientAddress,
  toParaId
}: QueryDeliveryFeesParams) {
  if (!api?.call?.xcmPaymentApi) return BN_ZERO;

  try {
    const destLocation = {
      V3: {
        parents: 1,
        interior: {
          X1: {
            Parachain: parseInt(toParaId)
          }
        }
      }
    };

    const xcmMessage = generateDestReserveXcmMessage({
      asset,
      recipientAddress,
      isEvmChain: false
    });

    if (!xcmMessage) return BN_ZERO;

    const deliveryFee = await api.call.xcmPaymentApi.queryDeliveryFees(
      destLocation,
      xcmMessage
    );

    const humanReadableFee = deliveryFee.toJSON() as {
      ok: {
        v3: {
          fun: { fungible: number };
        }[];
      };
    };

    if (!humanReadableFee?.ok?.v3 || humanReadableFee.ok.v3.length === 0)
      return BN_ZERO;

    if (!humanReadableFee.ok.v3[0]?.fun?.fungible) return BN_ZERO;

    return bnToBn(humanReadableFee.ok.v3[0].fun.fungible);
  } catch (error) {
    console.error('Failed to query XCM delivery fees:', error);
    return BN_ZERO;
  }
}
