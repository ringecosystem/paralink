import {
  createStandardXcmInterior,
  createStandardXcmInteriorByFilterParaId,
  createStandardXcmInteriorByTargetXcmLocation
} from '@/utils/xcm/interior-params';
import { ApiPromise } from '@polkadot/api';
import { MultiLocation } from '@polkadot/types/interfaces/xcm';
import { parseUnits } from '@/utils/format';

import { BN, BN_ZERO, bnToBn } from '@polkadot/util';
import {
  generateBeneficiary,
  isDotLocation,
  normalizeInterior
} from '@/utils/xcm/helper';
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

type CalculateExecutionWeightParams = Omit<XcmTransferParams, 'isEvmChain'> & {
  api: ApiPromise;
  targetChainId: number;
};
export async function calculateExecutionWeight({
  api,
  asset,
  recipientAddress,
  isAssetHub,
  targetChainId
}: CalculateExecutionWeightParams) {
  let xcmMessage:
    | ReturnType<typeof generateDestReserveXcmMessage>
    | ReturnType<typeof generateLocalReserveXcmMessage>
    | ReturnType<typeof generateRemoteReserveXcmMessage>
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
  } else if (asset?.reserveType === 'remote') {
    xcmMessage = generateRemoteReserveXcmMessage({
      asset,
      targetChainId,
      recipientAddress
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
      if (isDotLocation(asset?.xcmLocation)) {
        assetInfo = {
          V3: {
            Concrete: {
              parents: 1,
              interior: 'Here'
            }
          }
        };
      } else {
        assetInfo = {
          V3: {
            Concrete: asset?.targetXcmLocation
              ? createStandardXcmInteriorByTargetXcmLocation(
                  asset?.targetXcmLocation
                )
              : {
                  parents: asset?.reserveType === ReserveType.Local ? 1 : 0,
                  interior: createStandardXcmInteriorByFilterParaId(
                    paraId,
                    asset.xcmLocation?.v1?.interior
                  )
                }
          }
        };
      }
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
    isAssetHub: Number(paraId) === 1000,
    targetChainId: paraId
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

  // console.log('fee', fee?.toString());
  console.log('isDotLocation', isDotLocation(asset?.xcmLocation));

  if (paraId === 1000 && !isDotLocation(asset?.xcmLocation)) {
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
