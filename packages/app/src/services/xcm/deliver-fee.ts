import { BN_ZERO, bnToBn } from '@polkadot/util';
import { createStandardXcmInterior } from '@/utils/xcm/interior-params';
import { parseUnits } from '@/utils/format';
import { generateBeneficiary } from '@/utils/xcm/helper';
import type { ApiPromise } from '@polkadot/api';
import type { Asset } from '@/types/xcm-asset';

type XcmTransferParams = {
  asset: Asset;
  recipientAddress: string;
};

export function generateDestReserveXcmMessage({
  asset,
  recipientAddress
}: XcmTransferParams) {
  if (!asset.xcmLocation) return null;
  try {
    const multiLocation = asset.xcmLocation;

    const assetId = {
      id: {
        Concrete: {
          parents: 0,
          interior: createStandardXcmInterior(multiLocation?.v1?.interior)
        }
      },
      fun: {
        Fungible: parseUnits({
          value: '1',
          decimals: asset.decimals
        })?.toString()
      }
    };

    const beneficiary = generateBeneficiary(recipientAddress);
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
    console.error('generateDestReserveXcmMessage error:', error);
    return null;
  }
}

export function generateLocalReserveXcmMessage({
  asset,
  recipientAddress
}: XcmTransferParams) {
  if (!asset.xcmLocation) return null;
  try {
    const multiLocation = asset.xcmLocation;

    const assetId = {
      id: {
        Concrete: {
          parents: 1,
          interior: createStandardXcmInterior(multiLocation?.v1?.interior)
        }
      },
      fun: {
        Fungible: parseUnits({
          value: '1',
          decimals: asset.decimals
        })?.toString()
      }
    };

    const beneficiary = generateBeneficiary(recipientAddress);

    return {
      V3: [
        { ReserveAssetDeposited: [assetId] },
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
    console.error('generateLocalReserveXcmMessage error:', error);
    return null;
  }
}

export function generateRemoteReserveXcmMessage({
  asset,
  targetChainId,
  recipientAddress
}: Omit<XcmTransferParams, 'isAssetHub'> & { targetChainId: number }) {
  try {
    const interior = asset?.targetXcmLocation
      ? createStandardXcmInterior(asset?.targetXcmLocation?.v1?.interior)
      : createStandardXcmInterior(asset?.xcmLocation?.v1?.interior);

    const baseAssetLocation = {
      parents: 1,
      interior: interior
    };

    const WithdrawAsset = {
      id: {
        Concrete: baseAssetLocation
      },
      fun: {
        Fungible: parseUnits({
          value: '1',
          decimals: asset.decimals
        })?.toString()
      }
    };

    const SetFeesMode = {
      jitWithdraw: true
    };

    const xcmInDepositReserveAsset = [
      {
        BuyExecution: {
          fees: {
            Concrete: baseAssetLocation,
            fun: {
              Fungible: parseUnits({
                value: '1',
                decimals: asset.decimals
              })?.toString()
            }
          },
          weightLimit: 'Unlimited'
        }
      },
      {
        DepositAsset: {
          assets: {
            Wild: 'All'
          },
          beneficiary: generateBeneficiary(recipientAddress)
        }
      }
    ];

    const InitiateReserveWithdraw = {
      assets: {
        Wild: 'All'
      },
      reserve: {
        parents: 1,
        interior: {
          X1: {
            Parachain: targetChainId
          }
        }
      },
      xcm: xcmInDepositReserveAsset
    };
    return {
      V3: [
        {
          WithdrawAsset: [WithdrawAsset]
        },
        {
          SetFeesMode
        },
        {
          InitiateReserveWithdraw
        }
      ]
    };
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? 'Unknown error';
    console.error(errorMessage);
    return undefined;
  }
}

interface QueryDeliveryFeesParams {
  api: ApiPromise;
  asset: Asset;
  recipientAddress: string;
  toParaId: number;
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
            Parachain: toParaId
          }
        }
      }
    };
    let xcmMessage:
      | ReturnType<typeof generateDestReserveXcmMessage>
      | ReturnType<typeof generateLocalReserveXcmMessage>
      | ReturnType<typeof generateRemoteReserveXcmMessage>
      | null = null;
    if (asset.reserveType === 'foreign') {
      xcmMessage = generateDestReserveXcmMessage({
        asset,
        recipientAddress
      });
    } else if (asset.reserveType === 'local') {
      xcmMessage = generateLocalReserveXcmMessage({
        asset,
        recipientAddress
      });
    } else if (asset.reserveType === 'remote') {
      xcmMessage = generateRemoteReserveXcmMessage({
        asset,
        targetChainId: toParaId,
        recipientAddress
      });
    }
    console.log('deliver fee xcmMessage', xcmMessage);
    if (!xcmMessage) return BN_ZERO;

    const deliveryFee = await api.call.xcmPaymentApi.queryDeliveryFees(
      destLocation,
      xcmMessage
    );

    console.log('deliver fee', deliveryFee?.toJSON());

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
