import { parseUnits } from '@/utils/format';
import { Signer, SubmittableExtrinsic } from '@polkadot/api/types';
import { ApiPromise } from '@polkadot/api';
import {
  createStandardXcmInterior,
  createStandardXcmInteriorByFlatInterior
} from '@/utils/xcm/interior-params';

import { generateBeneficiary, normalizeInterior } from '@/utils/xcm/helper';
import { XcmRequestInteriorParams } from '@/utils/xcm/type';
import { type ChainConfig, type Asset, ReserveType } from '@/types/registry';

type XcmTransferParams = {
  token: Asset;
  amount: string;
  targetChain: ChainConfig;
  recipientAddress: string;
};

export function createXcmTransfer({
  token,
  amount,
  targetChain,
  recipientAddress
}: XcmTransferParams) {
  const amountInWei = parseUnits({
    value: amount,
    decimals: token.decimals
  });
  if (amountInWei.isZero()) return undefined;
  try {
    let interior: XcmRequestInteriorParams | XcmRequestInteriorParams[] | null =
      null;
    const flatInterior = normalizeInterior(token.xcmLocation?.v1?.interior);
    if (
      token?.reserveType === ReserveType.Local &&
      Array.isArray(flatInterior) &&
      flatInterior.length > 0
    ) {
      interior = createStandardXcmInteriorByFlatInterior(
        flatInterior?.filter((v) => !v.parachain)
      );
    } else {
      interior = createStandardXcmInterior(token.xcmLocation?.v1?.interior);
    }
    const dest = {
      V3: {
        parents: 1,
        interior: {
          X1: {
            Parachain: targetChain?.id
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
  sourceChainId: number;
  fromChainApi: ApiPromise;
  token: Asset;
  amount: string;
  targetChain: ChainConfig;
  recipientAddress: string;
};
export const createXcmTransferExtrinsic = async ({
  sourceChainId,
  fromChainApi,
  token,
  amount,
  targetChain,
  recipientAddress
}: CreateXcmTransferExtrinsicParams) => {
  const xcmTransferParams = createXcmTransfer({
    token,
    amount,
    targetChain,
    recipientAddress
  });
  if (!xcmTransferParams || !fromChainApi) return undefined;

  const extrinsic =
    sourceChainId !== 2006
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
            onFailure?.({
              txHash: result.txHash.toHex()
            });
            if (result.isCompleted) unsub();
          }
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
        onFailure?.({
          txHash: result.txHash.toHex()
        });
      } else if (event.method === 'ExtrinsicSuccess') {
        onSuccess?.({
          txHash: result.txHash.toHex(),
          messageHash: undefined,
          uniqueId: undefined
        });
      }
    });
}
