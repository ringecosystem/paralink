import { decodeAddress } from '@polkadot/util-crypto';
import { parseUnits } from '@/utils/format';
import { XcAssetData } from '@/types/asset-registry';
import { ChainInfoWithXcAssetsData } from '@/store/chains';
import { Signer, SubmittableExtrinsic } from '@polkadot/api/types';
import { ApiPromise } from '@polkadot/api';
import {
  createStandardXcmInterior,
  parseAndNormalizeXcm
} from '@/utils/xcm-location';

type XcmTransferParams = {
  token: XcAssetData;
  amount: string;
  toChain: ChainInfoWithXcAssetsData;
  recipientAddress: string; // 接收地址
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
    const location = parseAndNormalizeXcm(multiLocation);
    if (!location) return undefined;
    const interior = createStandardXcmInterior({
      interior: location?.interior
    });

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
                  key: Array.from(decodeAddress(recipientAddress))
                }
              }
        }
      }
    };

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
  if (!xcmTransferParams) return undefined;

  const extrinsic = fromChainApi.tx.polkadotXcm.limitedReserveTransferAssets(
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
  onPending?: (txHash: string) => void;
  onSuccess?: (txHash: string) => void;
  onError?: (txHash: string) => void;
};
export const signAndSendExtrinsic = async ({
  extrinsic,
  signer,
  sender,
  onPending,
  onSuccess,
  onError
}: SignAndSendExtrinsicParams) => {
  try {
    const unsub = await extrinsic.signAndSend(sender, { signer }, (result) => {
      onPending?.(result.txHash.toHex());
      if (result.isCompleted) {
        unsub();
      }

      if (result.status.isFinalized || result.status.isInBlock) {
        result.events
          .filter(({ event: { section } }) => section === 'system')
          .forEach(({ event: { method } }): void => {
            if (method === 'ExtrinsicFailed') {
              onError?.(result.txHash.toHex());
            } else if (method === 'ExtrinsicSuccess') {
              onSuccess?.(result.txHash.toHex());
            }
          });
      } else if (result.isError) {
        onError?.(result.txHash.toHex());
      }
    });
  } catch (err) {
    console.error(err);
  } finally {
    //
  }
};
