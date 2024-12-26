import { BN_ZERO, bnToBn, u8aToHex } from '@polkadot/util';
import { createStandardXcmInterior } from '@/utils/xcm/interior-params';
import { parseUnits } from '@/utils/format';
import { generateBeneficiary, generateBeneficiaryV4 } from '@/utils/xcm/helper';
import type { ApiPromise } from '@polkadot/api';
import type { Asset } from '@/types/xcm-asset';
import type { CalculateExecutionWeightType } from './xcm-weight';

type XcmTransferParams = {
  asset: Asset;
  recipientAddress: string;
  calculateWeightType: CalculateExecutionWeightType;
};

export function generateDestReserveXcmMessage({
  asset,
  recipientAddress
}: Omit<XcmTransferParams, 'calculateWeightType'>) {
  if (!asset.xcmLocation) return null;
  try {
    const multiLocation = asset.xcmLocation;
    console.log('generateDestReserveXcmMessage asset', asset);

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
      V2: [
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
            maxAssets: 1,
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
  recipientAddress,
  calculateWeightType
}: XcmTransferParams) {
  if (!asset.xcmLocation) return null;
  try {
    const multiLocation = asset.xcmLocation;

    const assetId =
      calculateWeightType === 'fromPolkadot'
        ? {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  Here: null
                }
              }
            },
            fun: { Fungible: '10000000000' }
          }
        : {
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
    const beneficiaryV4 = generateBeneficiaryV4(recipientAddress);

    return calculateWeightType === 'fromAssetHub' ||
      calculateWeightType === 'toPolkadot'
      ? {
          V4: [
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
                assets: {
                  Wild: {
                    AllCounted: 1
                  }
                },
                beneficiary: beneficiaryV4
              }
            },
            {
              SetTopic: u8aToHex(new Uint8Array(32).fill(0))
            }
          ]
        }
      : {
          V2: [
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
                maxAssets: 1,
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

export function generateDotFromAssetHubToPolkadotXcmMessage({
  recipientAddress
}: {
  recipientAddress: string;
}) {
  return {
    V4: [
      {
        ReceiveTeleportedAsset: [
          {
            id: { Concrete: { parents: 1, interior: 'Here' } },
            fun: { Fungible: '10000000000' }
          }
        ]
      },
      {
        ClearOrigin: null
      },
      {
        BuyExecution: {
          fees: {
            Concrete: { parents: 1, interior: 'Here' },
            fun: { Fungible: '10000000000' }
          },
          weightLimit: 'Unlimited'
        }
      },
      {
        DepositAsset: {
          assets: {
            Wild: {
              AllCounted: 1
            }
          },
          beneficiary: generateBeneficiaryV4(recipientAddress)
        }
      },
      {
        SetTopic: u8aToHex(new Uint8Array(32).fill(0))
      }
    ]
  };
}

export function generateDotFromPolkadotToAssetHubXcmMessage({
  recipientAddress
}: {
  recipientAddress: string;
}) {
  return {
    V4: [
      {
        ReceiveTeleportedAsset: [
          {
            id: { Concrete: { parents: 0, interior: 'Here' } },
            fun: { Fungible: '10000000000' }
          }
        ]
      },
      {
        ClearOrigin: null
      },
      {
        BuyExecution: {
          fees: {
            Concrete: { parents: 0, interior: 'Here' },
            fun: { Fungible: '10000000000' }
          },
          weightLimit: 'Unlimited'
        }
      },
      {
        DepositAsset: {
          assets: { Wild: { AllCounted: 1 } },
          beneficiary: generateBeneficiaryV4(recipientAddress)
        }
      },
      {
        SetTopic: u8aToHex(new Uint8Array(32).fill(0))
      }
    ]
  };
}

interface QueryDeliveryFeesParams {
  api: ApiPromise;
  asset: Asset;
  recipientAddress: string;
  sourceChainId: number;
  targetChainId: number;
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
  sourceChainId,
  targetChainId
}: QueryDeliveryFeesParams) {
  if (!api?.call?.xcmPaymentApi) return BN_ZERO;

  let calculateWeightType: CalculateExecutionWeightType;

  if (sourceChainId === 0) {
    calculateWeightType = 'fromPolkadot';
  } else if (targetChainId === 0) {
    calculateWeightType = 'toPolkadot';
  } else if (targetChainId === 1000) {
    calculateWeightType = 'toAssetHub';
  } else if (sourceChainId === 1000) {
    calculateWeightType = 'fromAssetHub';
  } else {
    calculateWeightType = 'normal';
  }

  try {
    const destLocation =
      targetChainId === 0
        ? {
            V3: {
              parents: 1,
              interior: {
                Here: null
              }
            }
          }
        : {
            V3: {
              parents: sourceChainId === 0 ? 0 : 1,
              interior: {
                X1: {
                  Parachain: targetChainId
                }
              }
            }
          };
    let xcmMessage:
      | ReturnType<typeof generateDestReserveXcmMessage>
      | ReturnType<typeof generateLocalReserveXcmMessage>
      | ReturnType<typeof generateRemoteReserveXcmMessage>
      | ReturnType<typeof generateDotFromAssetHubToPolkadotXcmMessage>
      | ReturnType<typeof generateDotFromPolkadotToAssetHubXcmMessage>
      | null = null;
    if (sourceChainId === 1000 && targetChainId === 0) {
      xcmMessage = generateDotFromAssetHubToPolkadotXcmMessage({
        recipientAddress
      });
    } else if (sourceChainId === 0 && targetChainId === 1000) {
      xcmMessage = generateDotFromPolkadotToAssetHubXcmMessage({
        recipientAddress
      });
    } else if (asset.reserveType === 'foreign') {
      xcmMessage = generateDestReserveXcmMessage({
        asset,
        recipientAddress
      });
    } else if (asset.reserveType === 'local') {
      xcmMessage = generateLocalReserveXcmMessage({
        asset,
        recipientAddress,
        calculateWeightType
      });
    }
    console.log('deliver fee xcmMessage', destLocation, xcmMessage);
    if (!xcmMessage) return BN_ZERO;

    const deliveryFee = await api.call.xcmPaymentApi.queryDeliveryFees(
      destLocation,
      xcmMessage
    );

    console.log('deliver fee', deliveryFee?.toJSON());

    const humanReadableFee = deliveryFee.toJSON() as {
      ok: {
        [version: string]: {
          fun: { fungible: number };
        }[];
      };
    };

    if (!humanReadableFee?.ok) return BN_ZERO;

    const feeVersion = humanReadableFee.ok.v4 ? 'v4' : 'v3';
    const versionData = humanReadableFee.ok[feeVersion];

    if (!versionData || versionData.length === 0) return BN_ZERO;

    const fungible = versionData[0]?.fun?.fungible;
    if (!fungible) return BN_ZERO;

    return bnToBn(fungible);
  } catch (error) {
    console.error('Failed to query XCM delivery fees:', error);
    return BN_ZERO;
  }
}
