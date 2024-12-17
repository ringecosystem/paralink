import {
  createStandardXcmInterior,
  createStandardXcmInteriorByFilterParaId,
  createStandardXcmInteriorByTargetXcmLocation
} from '@/utils/xcm/interior-params';
import { ApiPromise } from '@polkadot/api';
import { MultiLocation } from '@polkadot/types/interfaces/xcm';
import { parseUnits } from '@/utils/format';

import { BN, BN_ZERO, bnToBn } from '@polkadot/util';
import { generateBeneficiary, normalizeInterior } from '@/utils/xcm/helper';
import { ReserveType, type Asset } from '@/types/xcm-asset';

export interface XcmV3MultiLocation {
  V3?: {
    Concrete?: MultiLocation;
  };
}

type XcmTransferParams = {
  asset: Asset;
  recipientAddress: string;
  isAssetHub: boolean;
};

export function generateDestReserveXcmMessage({
  asset,
  recipientAddress,
  isAssetHub
}: XcmTransferParams) {
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
      V2: [
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
    V2: [
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

export function generateRemoteReserveXcmMessage({
  amount,
  token,
  targetChain,
  recipientAddress,
  sourceChain, // 添加源链信息
  destChain    // 添加目标链信息
}: XcmTransferParams & {
  sourceChain: ChainConfig;
  destChain: ChainConfig;
}) {
  const amountInWei = parseUnits({
    value: amount,
    decimals: token.decimals
  });
  if (amountInWei.isZero()) return undefined;

  try {
    const interior = token?.targetXcmLocation ?
      createStandardXcmInterior(token?.targetXcmLocation?.v1?.interior)
      : createStandardXcmInterior(token?.xcmLocation?.v1?.interior);

    const baseAssetLocation = {
      parents: 1,
      interior: interior
    }

    const WithdrawAsset = [
      {
        id: {
          Concrete: baseAssetLocation,
        },
        fun: {
          Fungible: amountInWei
        }
      }
    ]

    const SetFeesMode = {
      jitWithdraw: true
    }

    const InitiateReserveWithdraw = {
      assets: {
        Wild: 'All'
      },
      reserve: {
        parents: 1,
        interior: {
          X1: {
            Parachain: sourceChain?.id
          }
        }
      }
    }

    const

    const xcmInDepositReserveAsset = [
      {
        BuyExecution: {
          fees: {
            Concrete: baseAssetLocation,
            fun: {
              Fungible: amountInWei
            }
          },
          weightLimit: 'Unlimited'
        },
      },
      {
        DepositAsset: {
          assets: {
            Wild: 'All'
          },
          beneficiary: generateBeneficiary(recipientAddress)
        }
      }
    ]






    // 目标链配置
    const dest = {
      V3: {
        parents: 1,
        interior: {
          X2: [
            { Parachain: targetChain?.id },
            {
              AccountId32: {
                network: null,
                id: recipientAddress
              }
            }
          ]
        }
      }
    };

    // 受益人配置
    const beneficiary = {
      V3: {
        parents: 0,
        interior: {
          X1: {
            AccountId32: {
              network: null,
              id: recipientAddress
            }
          }
        }
      }
    };

    // 资产配置，需要考虑资产在不同链上的表示
    const assetItems = [
      {
        id: {
          Concrete: {
            parents: 1,
            interior: {
              X3: [
                { Parachain: token.originChainId }, // 资产原始链 ID
                { PalletInstance: token.palletInstance },
                { GeneralIndex: token.generalIndex }
              ]
            }
          }
        },
        fun: { Fungible: amountInWei }
      }
    ];

    // 完整的 XCM 参数
    return {
      dest,
      beneficiary,
      assets: {
        V3: assetItems
      },
      feeAssetItem: 0,
      weightLimit: {
        Unlimited: null
      },
      // 添加其他必要的参数
      originLocation: {
        parents: 1,
        interior: {
          X1: {
            Parachain: sourceChain.id
          }
        }
      },
      destLocation: {
        parents: 1,
        interior: {
          X1: {
            Parachain: destChain.id
          }
        }
      },
      // 添加 XCM 版本信息
      version: 'V3'
    };
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? 'Unknown error';
    console.error(errorMessage);
    return undefined;
  }
}

type CalculateExecutionWeightParams = Omit<XcmTransferParams, 'isEvmChain'> & {
  api: ApiPromise;
};
export async function calculateExecutionWeight({
  api,
  asset,
  recipientAddress,
  isAssetHub
}: CalculateExecutionWeightParams) {
  let xcmMessage:
    | ReturnType<typeof generateDestReserveXcmMessage>
    | ReturnType<typeof generateLocalReserveXcmMessage>
    | null = null;

  if (asset?.reserveType === 'local') {
    xcmMessage = generateLocalReserveXcmMessage({
      asset,
      recipientAddress,
      isAssetHub
    });
  } else if (asset?.reserveType === 'foreign') {
    xcmMessage = generateDestReserveXcmMessage({
      asset,
      recipientAddress,
      isAssetHub
    });
  }
  try {
    if (!xcmMessage) {
      return {
        weight: null,
        xcmMessage: null
      };
    }
    console.log('fee token xcmMessage', xcmMessage);

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
  paraId: number;
  weight: {
    refTime: number;
    proofSize: number;
  };
  asset: Asset;
};

export async function calculateWeightFee({
  api,
  paraId,
  weight,
  asset
}: CalculateWeightFeeParams) {


  try {
    let assetInfo: Record<string, any> = {};

    if (paraId === 1000) {
      assetInfo = {
        V4: {
          parents: 1,
          interior: 'Here'
        }
      };
    } else {
      assetInfo = {
        V3: {
          Concrete: asset?.targetXcmLocation ? createStandardXcmInteriorByTargetXcmLocation(asset?.targetXcmLocation) : {
            parents: asset?.reserveType === ReserveType.Local ? 1 : 0,
            interior: createStandardXcmInteriorByFilterParaId(
              paraId,
              asset.xcmLocation?.v1?.interior
            )
          }
        }
      };
    }

    console.log('fee token assetInfo', assetInfo);
    const fee = await api.call.xcmPaymentApi.queryWeightToAssetFee(
      weight,
      assetInfo
    );

    console.log('token fee', fee.toJSON());

    const humanFee = fee.toJSON() as
      | {
        ok: number;
      }
      | {
        err: string;
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
  asset: Asset;
  amount: string;
  includeFee?: boolean;
};

export async function quotePriceTokensForExactTokens({
  api,
  asset,
  amount
}: QuotePriceTokensParams) {
  try {
    const interior = normalizeInterior(asset?.xcmLocation?.v1?.interior);
    if (!interior) return null;

    const asset1Location = api
      .createType('MultiLocation', {
        parents: 0,
        interior: {
          X2: [
            {
              PalletInstance: Array.isArray(interior)
                ? interior?.find((item) => item.palletInstance)?.palletInstance
                : 50
            },
            {
              GeneralIndex: Array.isArray(interior)
                ? interior?.find((item) => item.generalIndex)?.generalIndex
                : 0
            }
          ]
        }
      })
      .toU8a();

    const asset2Location = api
      .createType('MultiLocation', {
        parents: 1,
        interior: 'Here'
      })
      .toU8a();
    const quote =
      await api.call.assetConversionApi.quotePriceTokensForExactTokens(
        asset1Location,
        asset2Location,
        amount,
        true
      );

    console.log('quotePriceTokensForExactTokens', quote?.toJSON());
    return quote.toJSON();
  } catch (error) {
    console.error('quotePriceTokens error:', error);
    return null;
  }
}

type GetXcmWeightFeeParams = {
  api: ApiPromise;
  asset: Asset;
  recipientAddress: string;
  paraId: number;
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

  console.log('weight', weight);

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

  console.log('fee', fee?.toString());

  if (paraId === 1000) {
    const quote = (await quotePriceTokensForExactTokens({
      api,
      asset,
      amount: fee?.toString()
    })) as number | null;
    console.log('quote', quote);
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
