import { parseUnits } from '@/utils/format';
import { ReserveType, XcAssetData } from '@/types/asset-registry';
import { ChainInfoWithXcAssetsData } from '@/store/chains';
import { Signer, SubmittableExtrinsic } from '@polkadot/api/types';
import { ApiPromise } from '@polkadot/api';
import {
  createStandardXcmInterior,
  createStandardXcmInteriorByFlatInterior
} from '@/utils/xcm/interior-params';

import { generateBeneficiary, normalizeInterior } from '@/utils/xcm/helper';
import { XcmRequestInteriorParams } from '@/utils/xcm/type';

type XcmTransferParams = {
  token: XcAssetData;
  amount: string;
  toChain: ChainInfoWithXcAssetsData;
  recipientAddress: string;
};

export function createXcmTransfer({
  token,
  amount,
  toChain,
  recipientAddress
}: XcmTransferParams) {
  console.log('amount', amount);

  const amountInWei = parseUnits({
    value: amount,
    decimals: token.decimals
  });
  if (amountInWei.isZero()) return undefined;
  try {
    const multiLocation = JSON.parse(token.xcmV1MultiLocation);
    let interior: XcmRequestInteriorParams | XcmRequestInteriorParams[] | null =
      null;
    const flatInterior = normalizeInterior(multiLocation?.v1?.interior);
    if (
      token?.reserveType === ReserveType.Local &&
      Array.isArray(flatInterior) &&
      flatInterior.length > 0
    ) {
      interior = createStandardXcmInteriorByFlatInterior(
        flatInterior?.filter((v) => !v.parachain)
      );
    } else {
      interior = createStandardXcmInterior(multiLocation?.v1?.interior);
    }

    const dest = {
      V3: {
        parents: 1,
        interior: {
          X1: {
            Parachain: toChain?.id
          }
        }
      }
    };

    const beneficiary = generateBeneficiary(recipientAddress);

    const assetItems = [
      {
        id: {
          Concrete: {
            parents: token?.reserveType === ReserveType.Local ? 0 : 1,
            interior
          }
        },
        fun: { Fungible: amountInWei }
      }
    ];

    const xcmParams = {
      dest,
      beneficiary: {
        V3: beneficiary
      },
      assets: {
        V3: assetItems
      },
      feeAssetItem: assetItems.length - 1,
      weightLimit: {
        Unlimited: null
      }
    };

    return xcmParams;
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? 'Unknown error';
    console.error(errorMessage);
    return undefined;
  }
}

type CreateXcmTransferExtrinsicParams = {
  sourceChainId: string;
  fromChainApi: ApiPromise;
  token: XcAssetData;
  amount: string;
  toChain: ChainInfoWithXcAssetsData;
  recipientAddress: string;
};
export const createXcmTransferExtrinsic = async ({
  sourceChainId,
  fromChainApi,
  token,
  amount,
  toChain,
  recipientAddress
}: CreateXcmTransferExtrinsicParams) => {
  const xcmTransferParams = createXcmTransfer({
    token,
    amount,
    toChain,
    recipientAddress
  });
  if (!xcmTransferParams || !fromChainApi) return undefined;

  const extrinsic =
    sourceChainId !== '2006'
      ? fromChainApi.tx.polkadotXcm.transferAssets(
          xcmTransferParams.dest,
          xcmTransferParams.beneficiary,
          xcmTransferParams.assets,
          xcmTransferParams.feeAssetItem,
          xcmTransferParams.weightLimit
        )
      : fromChainApi.tx.polkadotXcm.reserveTransferAssets(
          xcmTransferParams.dest,
          xcmTransferParams.beneficiary,
          xcmTransferParams.assets,
          xcmTransferParams.feeAssetItem
        );
  return extrinsic;
};

type SignAndSendExtrinsicParams = {
  extrinsic: SubmittableExtrinsic<'promise'>;
  signer: Signer;
  sender: string;
  onPending?: ({ txHash }: { txHash: string }) => void;
  onSuccess?: ({
    txHash,
    messageHash,
    uniqueId
  }: {
    txHash: string;
    messageHash?: string;
    uniqueId?: string;
  }) => void;
  onFailure?: ({ txHash }: { txHash?: string }) => void;
  onError?: (message: string) => void;
};
export const signAndSendExtrinsic = async ({
  extrinsic,
  signer,
  sender,
  onPending,
  onSuccess,
  onFailure,
  onError
}: SignAndSendExtrinsicParams) => {
  try {
    let txHash: string | undefined;
    const unsub = await extrinsic.signAndSend(
      sender,
      { signer },
      async (result) => {
        console.log('result', result);

        if (!txHash) {
          txHash = result.txHash.toHex();
          onPending?.({
            txHash
          });
          if (result.status.isFinalized || result.status.isInBlock) {
            handleRegularTransaction(result, onSuccess, onFailure);
            if (result.isCompleted) unsub();
          } else if (result.isError) {
            console.log('ExtrinsicError', result);
            onFailure?.({
              txHash: result.txHash.toHex()
            });
            if (result.isCompleted) unsub();
          }
          //   try {
          //     const xcmResult = await checkXcmTransaction({
          //       hash: txHash,
          //       paraId: Number(sourceChainId)
          //     });

          //     switch (xcmResult.status) {
          //       case XcmMessageStatus.INVALID_PARA_ID:
          //         shouldCheckRegularTransaction = true;
          //         break;

          //       case XcmMessageStatus.SUCCESS:
          //         onSuccess?.({
          //           txHash,
          //           messageHash: xcmResult.hash,
          //           uniqueId: xcmResult.hash
          //         });
          //         if (result.isCompleted) unsub();
          //         return;

          //       case XcmMessageStatus.EXTRINSIC_FAILED:
          //       case XcmMessageStatus.TIMEOUT:
          //       case XcmMessageStatus.UNKNOWN_ERROR:
          //         onFailure?.({ txHash });
          //         onError?.(xcmResult.message);
          //         if (result.isCompleted) unsub();
          //         return;
          //     }
          //   } catch (error) {
          //     console.error('XCM check error:', error);
          //     // XCM 检查出错，也标记需要检查常规交易结果
          //     shouldCheckRegularTransaction = true;
          //   }
          // }

          // // 只有在需要检查常规交易时才执行以下逻辑
          // if (shouldCheckRegularTransaction) {
          //   if (result.status.isFinalized || result.status.isInBlock) {
          //     handleRegularTransaction(result, onSuccess, onFailure);
          //     if (result.isCompleted) unsub();
          //   } else if (result.isError) {
          //     console.log('ExtrinsicError', result);
          //     onFailure?.({
          //       txHash: result.txHash.toHex()
          //     });
          //     if (result.isCompleted) unsub();
          //   }
          // }
        }
      }
    );
  } catch (err) {
    console.error(err);
    onError?.(err instanceof Error ? err.message : 'Unknown error');
    throw new Error('Transaction failed');
  }
};

function handleRegularTransaction(
  result: any,
  onSuccess?: ({
    txHash,
    messageHash,
    uniqueId
  }: {
    txHash: string;
    messageHash?: string;
    uniqueId?: string;
  }) => void,
  onFailure?: ({ txHash }: { txHash?: string }) => void
) {
  result.events
    .filter(({ event }: { event: any }) => event.section === 'system')
    .forEach(({ event }: { event: any }) => {
      if (event.method === 'ExtrinsicFailed') {
        console.log('ExtrinsicFailed', result);
        onFailure?.({
          txHash: result.txHash.toHex()
        });
      } else if (event.method === 'ExtrinsicSuccess') {
        console.log('ExtrinsicSuccess', result);
        onSuccess?.({
          txHash: result.txHash.toHex(),
          messageHash: undefined,
          uniqueId: undefined
        });
      }
    });
}
