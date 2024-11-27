import { XcAssetData } from '@/types/asset-registry';
import {
  createStandardXcmInterior,
  parseAndNormalizeXcm
} from '@/utils/xcm-location';
import { ApiPromise } from '@polkadot/api';
import { decodeAddress } from '@polkadot/util-crypto';
import { MultiLocation } from '@polkadot/types/interfaces/xcm';
import { isXcmLocationMatch } from '@/utils/xcm';
import { parseUnits } from '@/utils/format';
import {
  removeCommasAndConvertToBN,
  removeCommasAndConvertToNumber
} from '@/utils/number';
import { BN_ZERO } from '@polkadot/util';

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

export async function getAssetHubAssetIsSufficient({
  api,
  asset
}: GetCrossTokenParams) {
  try {
    const multiLocation = JSON.parse(asset?.xcmV1MultiLocation);
    const location = parseAndNormalizeXcm(multiLocation);
    if (location) {
      const { interior } = location;
      let assetId;
      if (Array.isArray(interior)) {
        assetId = interior?.find((item) => item.GeneralIndex)?.GeneralIndex;
      } else {
        assetId = interior?.GeneralIndex;
      }
      if (assetId) {
        const assetIdResult = await api.query.assets.asset(assetId);
        return (assetIdResult?.toHuman() as Record<string, string | boolean>)
          ?.isSufficient as boolean;
      }
    }
    return false;
  } catch (error) {
    console.log('error', error);
    return false;
  }
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
                id: Array.from(decodeAddress(recipientAddress))
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
      weightResponse.toHuman() as { Ok: { refTime: string; proofSize: string } }
    ).Ok;

    return {
      weight: {
        refTime: Number(humanWeight.refTime.replace(/,/g, '')),
        proofSize: Number(humanWeight.proofSize.replace(/,/g, ''))
      },
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
      Ok: {
        refTime: string;
        proofSize: string;
      };
    };
    if (!humanFee || typeof humanFee !== 'object') return null;
    if ('Ok' in humanFee)
      return {
        refTime: removeCommasAndConvertToNumber(humanFee.Ok.refTime),
        proofSize: removeCommasAndConvertToNumber(humanFee.Ok.proofSize)
      };
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

    return quote.toHuman();
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

  if (paraId === '1000') {
    const isAcceptable = await getAssetHubAssetIsSufficient({
      api,
      asset
    });
    if (!isAcceptable) {
      errMsg = 'Asset cannot be used as cross-chain payment token';
      return {
        fee: BN_ZERO,
        errMsg
      };
    }
  } else {
    const isAcceptable = await checkAcceptablePaymentToken({
      api,
      asset
    });
    if (!isAcceptable) {
      errMsg = 'Asset cannot be used as cross-chain payment token';
      return {
        fee: BN_ZERO,
        errMsg
      };
    }
  }

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
  })) as Record<string, any>;

  if (!fee) {
    errMsg = 'Failed to calculate weight fee';
    return {
      fee: BN_ZERO,
      errMsg
    };
  }

  if (paraId === '1000') {
    const quote = await quotePriceTokensForExactTokens({
      api,
      asset,
      amount: fee?.replace(/,/g, ''),
      includeFee: true
    });

    return {
      fee: !quote ? BN_ZERO : removeCommasAndConvertToBN(quote?.toString()),
      errMsg: ''
    };
  } else {
    return {
      fee: !fee ? BN_ZERO : removeCommasAndConvertToBN(fee?.toString()),
      errMsg: ''
    };
  }
};
