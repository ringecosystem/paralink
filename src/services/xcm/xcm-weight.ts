import { XcAssetData } from '@/types/asset-registry';
import { createStandardXcmInterior } from '@/utils/xcm/interior-params';
import { ApiPromise } from '@polkadot/api';
import { MultiLocation } from '@polkadot/types/interfaces/xcm';
import { parseUnits } from '@/utils/format';

import { BN, BN_ZERO, bnToBn } from '@polkadot/util';
import { generateBeneficiary } from '@/utils/xcm/helper';

export interface XcmV3MultiLocation {
  V3?: {
    Concrete?: MultiLocation;
  };
}

type XcmTransferParams = {
  asset: XcAssetData;
  recipientAddress: string;
  isAssetHub: boolean;
};

export function generateDestReserveXcmMessage({
  asset,
  recipientAddress,
  isAssetHub
}: XcmTransferParams) {
  try {
    const multiLocation = JSON.parse(asset.xcmV1MultiLocation);

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
            fees: isAssetHub
              ? {
                  id: {
                    Concrete: {
                      parents: 1,
                      interior: {
                        Here: null
                      }
                    }
                  },
                  fun: {
                    Fungible: parseUnits({
                      value: '1',
                      decimals: asset.decimals
                    })?.toString()
                  }
                }
              : assetId,
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

export function generateLocalReserveXcmMessage({
  asset,
  recipientAddress,
  isAssetHub
}: XcmTransferParams) {
  const multiLocation = JSON.parse(asset.xcmV1MultiLocation);

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
          fees: isAssetHub
            ? {
                id: {
                  Concrete: {
                    parents: 1,
                    interior: {
                      Here: null
                    }
                  }
                },
                fun: {
                  Fungible: parseUnits({
                    value: '1',
                    decimals: asset.decimals
                  })?.toString()
                }
              }
            : assetId,
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
}

/**

 */
// export function generateRemoteReserveXcmMessage({
//   token,
//   amount,
//   toChain,
//   recipientAddress
// }: XcmTransferParams) {
//   const isToEvm = toChain.isEvmChain;
//   const amountBN = new BN(amount);
//   const decimalsBN = new BN(10).pow(new BN(token.decimals));
//   const amountInWei = amountBN.mul(decimalsBN)?.toString();

//   const assetId = {
//     id: {
//       Concrete: {
//         parents: 1,
//         interior: JSON.parse(token.xcmV1MultiLocation).v1.interior
//       }
//     },
//     fun: {
//       Fungible: amountInWei
//     }
//   };

//   const innerMostXcm = [
//     {
//       BuyExecution: {
//         fees: assetId,
//         weightLimit: 'Unlimited'
//       }
//     },
//     {
//       DepositAsset: {
//         assets: { Wild: 'All' },
//         beneficiary: {
//           parents: 0,
//           interior: {
//             X1: isToEvm
//               ? {
//                   AccountKey20: {
//                     network: null,
//                     key: recipientAddress
//                   }
//                 }
//               : {
//                   AccountId32: {
//                     network: null,
//                     id: Array.from(decodeAddress(recipientAddress))
//                   }
//                 }
//           }
//         }
//       }
//     }
//   ];

//   const middleXcm = [
//     {
//       BuyExecution: {
//         fees: assetId,
//         weightLimit: 'Unlimited'
//       }
//     },
//     {
//       DepositReserveAsset: {
//         assets: { Wild: 'All' },
//         dest: {
//           parents: 1,
//           interior: {
//             X1: {
//               Parachain: toChain.id
//             }
//           }
//         },
//         xcm: innerMostXcm
//       }
//     }
//   ];

//   return {
//     V3: [
//       { WithdrawAsset: [assetId] },
//       { SetFeesMode: { jitWithdraw: true } },
//       {
//         InitiateReserveWithdraw: {
//           assets: { Wild: 'All' },
//           reserve: {
//             parents: 1,
//             interior: {
//               X1: {
//                 Parachain: toChain.id
//               }
//             }
//           },
//           xcm: middleXcm
//         }
//       }
//     ]
//   };
// }

type CalculateExecutionWeightParams = Omit<XcmTransferParams, 'isEvmChain'> & {
  api: ApiPromise;
};
export async function calculateExecutionWeight({
  api,
  asset,
  recipientAddress,
  isAssetHub
}: CalculateExecutionWeightParams) {
  let xcmMessage = null;

  if (asset?.reserveType === 'local') {
    console.log('local');

    xcmMessage = generateLocalReserveXcmMessage({
      asset,
      recipientAddress,
      isAssetHub
    });
  } else if (asset?.reserveType === 'foreign') {
    console.log('foreign');
    xcmMessage = generateDestReserveXcmMessage({
      asset,
      recipientAddress,
      isAssetHub
    });
  }
  try {
    if (!xcmMessage) {
      console.log('reserveType is not supported');
      return {
        weight: null,
        xcmMessage: null
      };
    }
    const weightResponse =
      await api.call.xcmPaymentApi.queryXcmWeight(xcmMessage);

    const humanWeight = (
      weightResponse.toJSON() as { ok: { refTime: number; proofSize: number } }
    ).ok;

    return {
      weight: humanWeight,
      xcmMessage
    };
  } catch (error) {
    console.log('error', error);
    return {
      weight: null,
      xcmMessage
    };
  }
}

type CalculateWeightFeeParams = {
  api: ApiPromise;
  paraId: string;
  weight: {
    refTime: number;
    proofSize: number;
  };
  asset: XcAssetData;
};

export async function calculateWeightFee({
  api,
  paraId,
  weight,
  asset
}: CalculateWeightFeeParams) {
  try {
    let assetInfo: Record<string, any> = {};

    if (paraId === '1000') {
      assetInfo = {
        V4: {
          parents: 1,
          interior: 'Here'
        }
      };
    } else {
      const multiLocation = JSON.parse(asset?.xcmV1MultiLocation);

      assetInfo = {
        V3: {
          Concrete: {
            parents: multiLocation?.v1?.parents === 1 ? 0 : 1,
            interior: createStandardXcmInterior(multiLocation?.v1?.interior)
          }
        }
      };
    }

    const fee = await api.call.xcmPaymentApi.queryWeightToAssetFee(
      weight,
      assetInfo
    );

    const humanFee = fee.toJSON() as {
      ok: number;
    };
    if (!humanFee || typeof humanFee !== 'object') return null;
    if ('ok' in humanFee) return bnToBn(humanFee.ok);
    return null;
  } catch (error) {
    console.log('calculateWeightFee error:', error);
    return null;
  }
}

type QuotePriceTokensParams = {
  api: ApiPromise;
  asset: XcAssetData;
  amount: string;
  includeFee?: boolean;
};

export async function quotePriceTokensForExactTokens({
  api,
  asset,
  amount
}: QuotePriceTokensParams) {
  try {
    const multiLocation = JSON.parse(asset?.xcmV1MultiLocation);
    const interior = createStandardXcmInterior(multiLocation?.v1?.interior);
    if (!location) return null;
    const asset1Location = {
      parents: 0,
      interior: {
        X2: [
          {
            PalletInstance: Array.isArray(interior)
              ? interior?.find((item) => item.PalletInstance)?.PalletInstance
              : 50
          },
          {
            GeneralIndex: Array.isArray(interior)
              ? interior?.find((item) => item.GeneralIndex)?.GeneralIndex
              : (interior?.GeneralIndex ?? 0)
          }
        ]
      }
    };

    const asset2Location = {
      parents: 1,
      interior: 'Here'
    };

    const quote =
      await api.call.assetConversionApi.quotePriceTokensForExactTokens(
        asset1Location,
        asset2Location,
        amount,
        'Yes'
      );

    return quote.toJSON();
  } catch (error) {
    console.error('quotePriceTokens error:', error);
    return null;
  }
}

type GetXcmWeightFeeParams = {
  api: ApiPromise;
  asset: XcAssetData;
  recipientAddress: string;
  paraId: string;
};
export const getXcmWeightFee = async ({
  api,
  asset,
  recipientAddress,
  paraId
}: GetXcmWeightFeeParams) => {
  let errMsg = '';

  const { weight } = await calculateExecutionWeight({
    api,
    asset,
    recipientAddress,
    isAssetHub: Number(paraId) === 1000
  });

  if (!weight) {
    errMsg = 'Failed to calculate execution weight';
    return {
      fee: BN_ZERO,
      errMsg
    };
  }

  const fee = (await calculateWeightFee({
    api,
    paraId,
    weight,
    asset
  })) as BN;
  if (!fee) {
    errMsg = 'Failed to calculate weight fee';
    return {
      fee: BN_ZERO,
      errMsg
    };
  }

  if (paraId === '1000') {
    const quote = (await quotePriceTokensForExactTokens({
      api,
      asset,
      amount: fee?.toString()
    })) as number | null;
    return {
      fee: quote ? bnToBn(quote) : BN_ZERO,
      errMsg: ''
    };
  } else {
    return {
      fee: fee ? fee : BN_ZERO,
      errMsg: ''
    };
  }
};
