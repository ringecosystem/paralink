import { ChainInfoWithXcAssetsData } from '@/store/chains';
import { XcAssetData } from '@/types/asset-registry';
import { ApiPromise } from '@polkadot/api';
import { BN } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto'; // 添加这个导入

type XcmTransferParams = {
  token: XcAssetData;
  amount: string;
  toChain: ChainInfoWithXcAssetsData;
  recipientAddress: string; // 接收地址
};

// 12pxLnQcjJqjG4mDaeJoKBLMfsdHZ2p2RxKHNEvicnZwZobx
// 0x3d6d656c1bf92f7028Ce4C352563E1C363C58ED5

/**
 * 生成目标链储备(Dest Reserve)场景下的XCM传输消息
 * 适用场景：当资产token在目标链B上注册时的跨链转账（A -> B）
 */
function calculateAmountWithDecimals(amount: string, decimals: number): string {
  // 移除所有小数点
  const cleanAmount = amount.replace('.', '');
  // 计算需要补充的精度（当前数字的小数位数与目标精度的差值）
  const currentDecimals = amount.split('.')[1]?.length || 0;
  const remainingDecimals = decimals - currentDecimals;

  // 补充剩余的精度（添加对应数量的0）
  return cleanAmount + '0'.repeat(Math.max(0, remainingDecimals));
}
export function generateDestReserveXcmMessage({
  token,
  amount,
  toChain,
  recipientAddress
}: XcmTransferParams) {
  const isToEvm = toChain.isEvmChain;

  const amountInWei = String(Number(amount) * 10 ** token.decimals);
  console.log('amountInwei', amountInWei);

  // 构建WithdrawAsset部分
  const multiLocation = JSON.parse(token.xcmV1MultiLocation);
  const interior = multiLocation?.v1?.interior;
  const assetId = {
    id: {
      Concrete: {
        parents: 0,
        interior: {
          X2: [{ PalletInstance: 50 }, { GeneralIndex: 1984 }]
        }
      }
    },
    fun: {
      Fungible: amountInWei
    }
  };
  console.log(
    'Array.from(decodeAddress(recipientAddress))',
    Array.from(decodeAddress(recipientAddress))
  );

  // 构建接收地址部分
  const beneficiary = {
    parents: 0,
    interior: {
      X1: isToEvm
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
}

/**
 * 生成源链储备(Local Reserve)场景下的XCM传输消息
 * 适用场景：当资产token在源链A上注册时的跨链转账（A -> B）
 */
export function generateLocalReserveXcmMessage({
  token,
  amount,
  toChain,
  recipientAddress
}: XcmTransferParams) {
  const isToEvm = toChain.isEvmChain;
  // 计算实际转账金额
  const amountBN = new BN(amount);
  const decimalsBN = new BN(10).pow(new BN(token.decimals));
  const amountInWei = amountBN.mul(decimalsBN)?.toString();

  // 构建WithdrawAsset部分
  const assetId = {
    id: {
      Concrete: {
        parents: 1,
        interior: JSON.parse(token.xcmV1MultiLocation).v1.interior
      }
    },
    fun: {
      Fungible: amountInWei
    }
  };

  // 构建接收地址部分
  const beneficiary = {
    parents: 0,
    interior: {
      X1: isToEvm
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
        DepositReserveAsset: {
          assets: { Wild: 'All' },
          dest: beneficiary,
          xcm: []
        }
      }
    ]
  };
}

/**
 * 生成远程储备(Remote Reserve)场景下的XCM传输消息
 * 适用场景：当资产token在第三方链C上注册时的跨链转账（A -> B）
 */
export function generateRemoteReserveXcmMessage({
  token,
  amount,
  toChain,
  recipientAddress
}: XcmTransferParams) {
  const isToEvm = toChain.isEvmChain;
  // 计算实际转账金额
  const amountBN = new BN(amount);
  const decimalsBN = new BN(10).pow(new BN(token.decimals));
  const amountInWei = amountBN.mul(decimalsBN)?.toString();

  // 构建WithdrawAsset部分
  const assetId = {
    id: {
      Concrete: {
        parents: 1,
        interior: JSON.parse(token.xcmV1MultiLocation).v1.interior
      }
    },
    fun: {
      Fungible: amountInWei
    }
  };

  // 构建最内层的 XCM 指令
  const innerMostXcm = [
    {
      BuyExecution: {
        fees: assetId,
        weightLimit: 'Unlimited'
      }
    },
    {
      DepositAsset: {
        assets: { Wild: 'All' },
        beneficiary: {
          parents: 0,
          interior: {
            X1: isToEvm
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
        }
      }
    }
  ];

  // 构建中间层的 XCM 指令
  const middleXcm = [
    {
      BuyExecution: {
        fees: assetId,
        weightLimit: 'Unlimited'
      }
    },
    {
      DepositReserveAsset: {
        assets: { Wild: 'All' },
        dest: {
          parents: 1,
          interior: {
            X1: {
              Parachain: toChain.id
            }
          }
        },
        xcm: innerMostXcm
      }
    }
  ];

  return {
    V3: [
      { WithdrawAsset: [assetId] },
      { SetFeesMode: { jitWithdraw: true } },
      {
        InitiateReserveWithdraw: {
          assets: { Wild: 'All' },
          reserve: {
            parents: 1,
            interior: {
              X1: {
                Parachain: toChain.id
              }
            }
          },
          xcm: middleXcm
        }
      }
    ]
  };
}
/**
 * 计算执行权重
 */
type CalculateExecutionWeightParams = XcmTransferParams & {
  api: ApiPromise;
};
export async function calculateExecutionWeight({
  api,
  token,
  amount,
  toChain,
  recipientAddress
}: CalculateExecutionWeightParams) {
  const xcmMessage = generateDestReserveXcmMessage({
    token,
    amount,
    toChain,
    recipientAddress
  });
  console.log('xcmMessage', xcmMessage);
  try {
    const weight = await api.call.xcmPaymentApi.queryXcmWeight(xcmMessage);
    return {
      weight,
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
