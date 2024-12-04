import { decodeAddress } from '@polkadot/util-crypto';
import { parseUnits } from '@/utils/format';
import { XcAssetData } from '@/types/asset-registry';
import { ChainInfoWithXcAssetsData } from '@/store/chains';
import { Signer, SubmittableExtrinsic } from '@polkadot/api/types';
import { ApiPromise } from '@polkadot/api';
import { createStandardXcmInterior } from '@/utils/xcm/interior-params';
import { u8aToHex } from '@polkadot/util';
import { checkTransactionHash } from '../subscan';

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
  const isToEvm = toChain.isEvmChain;
  console.log('amount', amount);

  const amountInWei = parseUnits({
    value: amount,
    decimals: token.decimals
  });
  if (amountInWei.isZero()) return undefined;
  try {
    const multiLocation = JSON.parse(token.xcmV1MultiLocation);
    const interior = createStandardXcmInterior(multiLocation?.v1?.interior);

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

    const beneficiary = {
      V3: {
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
                  id: u8aToHex(decodeAddress(recipientAddress))
                }
              }
        }
      }
    };
    console.log('recipientAddress', recipientAddress);
    console.log('beneficiary', beneficiary);
    const assetItems = [
      {
        id: {
          Concrete: {
            parents: 1,
            interior
          }
        },
        fun: { Fungible: amountInWei }
      }
    ];

    const xcmParams = {
      dest,
      beneficiary,
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
  fromChainApi: ApiPromise;
  token: XcAssetData;
  amount: string;
  toChain: ChainInfoWithXcAssetsData;
  recipientAddress: string;
};
export const createXcmTransferExtrinsic = async ({
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

  const extrinsic = fromChainApi.tx.polkadotXcm.transferAssets(
    xcmTransferParams.dest,
    xcmTransferParams.beneficiary,
    xcmTransferParams.assets,
    xcmTransferParams.feeAssetItem,
    xcmTransferParams.weightLimit
  );
  return extrinsic;
};

type SignAndSendExtrinsicParams = {
  extrinsic: SubmittableExtrinsic<'promise'>;
  signer: Signer;
  sender: string;
  onStart?: ({ txHash }: { txHash: string }) => void;
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
  onStart,
  onPending,
  onSuccess,
  onFailure,
  onError
}: SignAndSendExtrinsicParams) => {
  try {
    let hasStarted = false;

    const unsub = await extrinsic.signAndSend(sender, { signer }, (result) => {
      if (!hasStarted) {
        onStart?.({
          txHash: result.txHash.toHex()
        });
        hasStarted = true;
      }

      onPending?.({
        txHash: result.txHash.toHex()
      });

      if (result.isCompleted) unsub();

      if (result.status.isFinalized || result.status.isInBlock) {
        let messageHash: string | undefined;

        const sentEvent = result.events.find(
          ({ event }) => event.index.toHex() === '0x6f00'
        );

        if (sentEvent) {
          messageHash = sentEvent.event.data[0].toHex();
          console.log('XCM Message Hash:', messageHash);
        }

        result.events
          .filter(({ event }) => event.section === 'system')
          .forEach(async ({ event }) => {
            if (event.method === 'ExtrinsicFailed') {
              onFailure?.({
                txHash: result.txHash.toHex()
              });
            } else if (event.method === 'ExtrinsicSuccess') {
              if (messageHash) {
                const uniqueId = await checkTransactionHash({
                  hash: messageHash
                });
                if (uniqueId) {
                  console.log(
                    'XCM Message Hash:',
                    `https://polkadot.subscan.io/xcm_message/polkadot-${uniqueId}`
                  );
                }
                onSuccess?.({
                  txHash: result.txHash.toHex(),
                  messageHash,
                  uniqueId
                });
              } else {
                onSuccess?.({
                  txHash: result.txHash.toHex(),
                  messageHash: undefined,
                  uniqueId: undefined
                });
              }
            }
          });
      } else if (result.isError) {
        onFailure?.({
          txHash: result.txHash.toHex()
        });
      }
    });
  } catch (err) {
    console.error(err);
    onError?.(err instanceof Error ? err.message : 'Unknown error');
    throw new Error('Transaction failed');
  }
};
