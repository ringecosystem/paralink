import { parseUnits } from '@/utils/format';
import { Signer, SubmittableExtrinsic } from '@polkadot/api/types';
import { ApiPromise } from '@polkadot/api';
import {
  createStandardXcmInterior,
  createStandardXcmInteriorByFlatInterior
} from '@/utils/xcm/interior-params';

import {
  generateBeneficiary,
  isDotLocation,
  normalizeInterior
} from '@/utils/xcm/helper';
import { XcmRequestInteriorParams } from '@/types/xcm-location';
import { type ChainConfig, type Asset, ReserveType } from '@/types/xcm-asset';

type XcmTransferParams = {
  token: Asset;
  amount: string;
  targetChain: ChainConfig;
  recipientAddress: string;
};

export type TransactionStatus = {
  inBlock?: string;
  finalized?: string;
};

export type EventData = {
  section: string;
  method: string;
  data: any;
  documentation: string[];
};

export type DecodedResult = {
  txHash: string;
  status: TransactionStatus;
  events: EventData[];
};

export type TransactionEvent = {
  event: {
    section: string;
    method: string;
    data: any[];
    meta: {
      docs: {
        toString: () => string;
      }[];
    };
  };
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
    if (token?.reserveType === ReserveType.Local) {
      const flatInterior = normalizeInterior(
        token?.targetXcmLocation
          ? token?.targetXcmLocation?.v1?.interior
          : token?.xcmLocation?.v1?.interior
      );
      if (Array.isArray(flatInterior) && flatInterior.length > 0) {
        interior = createStandardXcmInteriorByFlatInterior(
          flatInterior?.filter((v) => !v.parachain)
        );
      }
    } else {
      interior = createStandardXcmInterior(token?.xcmLocation?.v1?.interior);
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
          Concrete: isDotLocation(token.xcmLocation)
            ? {
                parents: 1,
                interior: {
                  Here: null
                }
              }
            : {
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
  console.log('xcmTransferParams', xcmTransferParams);
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
        const decodedResult = {
          status: result.status.toJSON(),
          events: result.events.map(({ event }) => ({
            section: event.section,
            method: event.method,
            data: event.data.toHuman(),
            documentation: event.meta.docs.map((d) => d.toString())
          }))
        } as DecodedResult;

        if (!txHash) {
          txHash = result.txHash.toHex();
          onPending?.({
            txHash
          });
        }
        if (
          decodedResult?.status?.finalized ||
          decodedResult?.status?.inBlock
        ) {
          const extrinsicEvent = decodedResult.events.find(
            (event) =>
              event.method === 'ExtrinsicSuccess' ||
              event.method === 'ExtrinsicFailed'
          );

          if (extrinsicEvent?.method === 'ExtrinsicSuccess') {
            onSuccess?.({
              txHash
            });
            unsub();
          } else if (extrinsicEvent?.method === 'ExtrinsicFailed') {
            onFailure?.({
              txHash
            });
            unsub();
          }
        } else if (result.isError) {
          onFailure?.({
            txHash: result.txHash.toHex()
          });
          if (result.isCompleted) unsub();
        }
      }
    );
  } catch (err) {
    console.error(err);
    onError?.(err instanceof Error ? err.message : 'Unknown error');
    throw new Error('Transaction failed');
  }
};
