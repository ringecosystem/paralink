import { XcAssetData } from '@/types/asset-registry';
import {
  createStandardXcmInterior,
  parseAndNormalizeXcm
} from '@/utils/xcm-location';
import { ApiPromise } from '@polkadot/api';
import { decodeAddress } from '@polkadot/util-crypto';
import { MultiLocation } from '@polkadot/types/interfaces/xcm';
import { parseUnits } from '@/utils/format';

import { BN, BN_ZERO, bnToBn, u8aToHex } from '@polkadot/util';

export interface XcmV3MultiLocation {
  V3?: {
    Concrete?: MultiLocation;
  };
}

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
  try {
    const multiLocation = JSON.parse(asset.xcmV1MultiLocation);

    const location = parseAndNormalizeXcm(multiLocation);
    if (!location) return null;

    const assetId = {
      id: {
        Concrete: {
          parents: location?.parents === 1 ? 0 : 1,
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

/**
 * 生成源链储备(Local Reserve)场景下的XCM传输消息
 * 适用场景：当资产token在源链A上注册时的跨链转账（A -> B）
 */
// export function generateLocalReserveXcmMessage({
//   token,
//   amount,
//   toChain,
//   recipientAddress
// }: XcmTransferParams) {
//   const isToEvm = toChain.isEvmChain;
//   // 计算实际转账金额
//   const amountBN = new BN(amount);
//   const decimalsBN = new BN(10).pow(new BN(token.decimals));
//   const amountInWei = amountBN.mul(decimalsBN)?.toString();

//   // 构建WithdrawAsset部分
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

//   // 构建接收地址部分
//   const beneficiary = {
//     parents: 0,
//     interior: {
//       X1: isToEvm
//         ? {
//             AccountKey20: {
//               network: null,
//               key: recipientAddress
//             }
//           }
//         : {
//             AccountId32: {
//               network: null,
//               id: Array.from(decodeAddress(recipientAddress))
//             }
//           }
//     }
//   };

//   return {
//     V3: [
//       { WithdrawAsset: [assetId] },
//       { ClearOrigin: null },
//       {
//         BuyExecution: {
//           fees: assetId,
//           weightLimit: 'Unlimited'
//         }
//       },
//       {
//         DepositReserveAsset: {
//           assets: { Wild: 'All' },
//           dest: beneficiary,
//           xcm: []
//         }
//       }
//     ]
//   };
// }

// /**
//  * 生成远程储备(Remote Reserve)场景下的XCM传输消息
//  * 适用场景：当资产token在第三方链C上注册时的跨链转账（A -> B）
//  */
// export function generateRemoteReserveXcmMessage({
//   token,
//   amount,
//   toChain,
//   recipientAddress
// }: XcmTransferParams) {
//   const isToEvm = toChain.isEvmChain;
//   // 计算实际转账金额
//   const amountBN = new BN(amount);
//   const decimalsBN = new BN(10).pow(new BN(token.decimals));
//   const amountInWei = amountBN.mul(decimalsBN)?.toString();

//   // 构建WithdrawAsset部分
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

//   // 构建最内层的 XCM 指令
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

//   // 构建中间层的 XCM 指令
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
  recipientAddress
}: CalculateExecutionWeightParams) {
  const xcmMessage = generateDestReserveXcmMessage({
    asset,
    recipientAddress,
    isEvmChain: false
  });
  try {
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
      const location = parseAndNormalizeXcm(multiLocation);
      if (location) {
        const { interior } = location;

        assetInfo = {
          V3: {
            Concrete: {
              parents: location?.parents === 1 ? 0 : 1,
              interior: createStandardXcmInterior({
                interior
              })
            }
          }
        };
      }
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
  amount,
  includeFee = false
}: QuotePriceTokensParams) {
  try {
    const multiLocation = JSON.parse(asset?.xcmV1MultiLocation);
    const location = parseAndNormalizeXcm(multiLocation);
    if (!location) return null;
    const asset1Location = {
      parents: 0,
      interior: {
        X2: [
          {
            PalletInstance: Array.isArray(location?.interior)
              ? location?.interior?.find((item) => item.PalletInstance)
                  ?.PalletInstance
              : location?.interior?.PalletInstance
          },
          {
            GeneralIndex: Array.isArray(location?.interior)
              ? location?.interior?.find((item) => item.GeneralIndex)
                  ?.GeneralIndex
              : location?.interior?.GeneralIndex
          }
        ]
      }
    };

    const asset2Location = {
      parents: 1,
      interior: 'Here'
    };
    const includeFeeBool = includeFee ? 'Yes' : 'No';

    const quote =
      await api.call.assetConversionApi.quotePriceTokensForExactTokens(
        asset1Location,
        asset2Location,
        amount,
        includeFeeBool
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

  // 计算 weight
  const { weight } = await calculateExecutionWeight({
    api,
    asset,
    recipientAddress
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
      amount: fee?.toString(),
      includeFee: true
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
