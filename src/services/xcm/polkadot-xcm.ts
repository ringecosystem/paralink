import type { ApiPromise } from '@polkadot/api';
import type { BN } from '@polkadot/util';

interface XCAssetData {
  paraID: number;
  nativeChainID: string;
  symbol: string;
  decimals: number;
  xcmV1MultiLocation: string;
  asset: string;
  assetHubReserveLocation: string;
  originChainReserveLocation: string;
}

export async function transferXCAsset(
  api: ApiPromise,
  recipient: string,
  amount: BN,
  assetData: XCAssetData,
  targetParachainId: number,
  feeAssetData?: XCAssetData,
  feeAmount?: BN
) {
  // 获取交易方法
  const section = 'polkadotXcm';
  const method = 'limitedReserveTransferAssets';
  const fn = api.tx[section][method];

  // 解析资产的 MultiLocation
  const assetMultiLocation = JSON.parse(assetData.xcmV1MultiLocation).v1;

  // 构建资产列表
  const assetItems = [
    {
      id: { Concrete: assetMultiLocation },
      fun: { Fungible: amount }
    }
  ];

  // 如果存在跨链费用资产，且与源资产不同，添加到资产列表中
  if (feeAssetData && feeAmount && feeAssetData.asset !== assetData.asset) {
    const feeAssetMultiLocation = JSON.parse(
      feeAssetData.xcmV1MultiLocation
    ).v1;
    assetItems.push({
      id: { Concrete: feeAssetMultiLocation },
      fun: { Fungible: feeAmount }
    });
  }

  // 构建目标地址
  const dest = {
    V3: {
      parents: assetMultiLocation.parents,
      interior: { X1: { Parachain: targetParachainId } }
    }
  };

  // 构建受益人地址
  const beneficiary = {
    V3: {
      parents: 0,
      interior: {
        X1: {
          AccountId32: {
            network: 'Any',
            id: recipient
          }
        }
      }
    }
  };

  // 构建资产列表
  const assets = { V3: assetItems };

  // 指定用于支付费用的资产索引
  const feeAssetItem = assetItems.length - 1;

  // 设置重量限制
  const weightLimit = { Unlimited: null };

  // 构建交易
  const extrinsic = fn(dest, beneficiary, assets, feeAssetItem, weightLimit);

  return extrinsic;
}

export function buildDestinationReserveXcmMessage({
  amount,
  assetData,
  recipient
}: {
  amount: BN;
  assetData: XCAssetData;
  recipient: string;
}) {
  // 1. 解析资产的MultiLocation
  const assetLocation = JSON.parse(assetData.xcmV1MultiLocation).v1;
  // 解析后的结构为:
  // {
  //   parents: 1,
  //   interior: {
  //     x2: [
  //       { parachain: 2000 },
  //       { generalKey: "0x0003" }
  //     ]
  //   }
  // }

  // 2. 构建支付费用的资产MultiLocation (使用第一个可用的资产)
  const feeAssetLocation = {
    parents: 0,
    interior: {
      X1: {
        PalletInstance: 10
      }
    }
  };

  // 3. 构建WithdrawAsset指令
  const withdrawAsset = {
    WithdrawAsset: {
      assets: [
        {
          id: {
            Concrete: {
              parents: assetLocation.parents, // 1
              interior: {
                X2: [
                  { Parachain: assetLocation.interior.x2[0].parachain }, // 2000
                  { GeneralKey: assetLocation.interior.x2[1].generalKey } // "0x0003"
                ]
              }
            }
          },
          fun: {
            Fungible: amount
          }
        }
      ]
    }
  };

  // 4. 构建ClearOrigin指令
  const clearOrigin = {
    ClearOrigin: null
  };

  // 5. 构建BuyExecution指令，使用fee asset
  const buyExecution = {
    BuyExecution: {
      fees: {
        id: {
          Concrete: feeAssetLocation
        },
        fun: {
          Fungible: 600000 // 手续费数量
        }
      },
      weightLimit: 'Unlimited'
    }
  };

  // 6. 构建DepositAsset指令
  const depositAsset = {
    DepositAsset: {
      assets: { Wild: 'All' },
      beneficiary: {
        parents: 0,
        interior: {
          X1: {
            AccountId32: {
              network: null,
              id: recipient
            }
          }
        }
      }
    }
  };

  // 7. 组装完整的XCM消息
  return {
    V3: [withdrawAsset, clearOrigin, buyExecution, depositAsset]
  };
}

// interface XcmFeeResult {
//   executionFee: BN;
//   deliveryFee: BN;
//   totalFee: BN;
//   feeAssetId: string;
// }
// export async function calculateXcmFees({
//   api,
//   destParaId,
//   xcmMessage
// }: {
//   api: ApiPromise;
//   destParaId: number;
//   xcmMessage: any; // XcmVersionedXcm类型，根据实际情况定义
// }): Promise<XcmFeeResult> {
//   // 1. 获取可用于支付费用的资产列表
//   const xcmVersion = await api?.query?.polkadotXcm?.safeXcmVersion();
//   // 2. 2. 调用api查看可以用来支付手续费的token, 参数就是第一步的version
//   const tokenXcm =
//     await api.query.xcmPaymentApi.queryAcceptablePaymentAssets(xcmVersion);
//   // 2. 计算执行weight
//   const weight = await api.query.xcmPaymentApi.queryXcmWeight(xcmMessage);

//   // 3. 计算执行费用
//   const feeAsset = {
//     V3: {
//       Concrete: {
//         parents: 0,
//         interior: 'Here'
//       }
//     }
//   };

//   const executionFee = await api.query.xcmPaymentApi.queryWeightToAssetFee(
//     {
//       refTime: weight.refTime,
//       proofSize: weight.proofSize
//     },
//     feeAsset
//   );

//   // 4. 计算传递费用
//   const destination = {
//     V2: {
//       parents: 0,
//       interior: {
//         X1: { Parachain: destParaId }
//       }
//     }
//   };

//   const deliveryFee = await api.query.xcmPaymentApi.queryDeliveryFees(
//     destination,
//     xcmMessage
//   );

//   // 5. 计算总费用
//   const totalFee = executionFee.add(deliveryFee);

//   return {
//     executionFee,
//     deliveryFee,
//     totalFee,
//     feeAssetId: acceptableAssets[0].toString() // 使用第一个可用资产
//   };
// }

// const

// 总结一下如何获取到cross token fee and name
// 1. 查Storage获取 xcm version
// 这个需要写成固定值，不是3就是4
const defaultXcmVersion = 3;

// 调用api查看可以用来支付手续费的token, 参数就是第一步的version
export const getAcceptablePaymentAsset = async (api: ApiPromise) => {
  try {
    const allowedAssets =
      await api.call.xcmPaymentApi.queryAcceptablePaymentAssets(
        defaultXcmVersion
      );

    return allowedAssets?.toJSON()?.ok?.[0];
  } catch (error) {
    console.error('fetch acceptable payment asset failed', error);
    return null;
  }
};

const calculateExecutionWeight = async (api: ApiPromise, xcmMessage: any) => {
  const weight = await api.query.xcmPaymentApi.queryXcmWeight(xcmMessage);
  return weight;
};

// // 获取cross token info
// const getCrossTokenInfo = async (api: ApiPromise) => {
//   const tokenInfo = await getAcceptablePaymentAssets(api, defaultXcmVersion);
//   return tokenInfo?.[0];
// };

// // 计算执行weight
// const calculateExecutionWeight = async (api: ApiPromise, xcmMessage: any) => {
//   const weight = await api.query.xcmPaymentApi.queryXcmWeight(xcmMessage);
//   return weight;
// };

// // 计算执行费用
// const calculateExecutionFee = async (api: ApiPromise, weight: any) => {
//   const crossTokenInfo = await getCrossTokenInfo(api);
//   const
//   const feeAsset = {
//     weight: {
//       refTime: weight.refTime,
//       proofSize: weight.proofSize
//     },
//     V3: {
//       Concrete: {
//         parents: 0,
//         interior: 'Here'
//       }
//     }
//   };
//   const executionFee = await api.query.xcmPaymentApi.queryWeightToAssetFee(
//     weight,
//     feeAsset
//   );
//   return executionFee;
// };
