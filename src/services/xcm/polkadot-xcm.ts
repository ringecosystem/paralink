import { decodeAddress } from '@polkadot/util-crypto';
import { parseUnits } from 'viem';
import { XcAssetData } from '@/types/asset-registry';
import { ChainInfoWithXcAssetsData } from '@/store/chains';
import { Signer, SubmittableExtrinsic } from '@polkadot/api/types';
import { formatStringTokenAmount } from '@/utils/number';
import { ApiPromise } from '@polkadot/api';

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
  const amountInWei = parseUnits(amount, token.decimals);

  try {
    // const interior = JSON.parse(token?.xcmV1MultiLocation)?.v1?.interior;
    // [{\"parachain\":1000},{\"palletInstance\":50},{\"generalIndex\":1337}]
    const interior = {
      X3: [
        { Parachain: toChain?.id },
        { PalletInstance: 50 },
        { GeneralIndex: 1984 }
      ]
    };

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

export const signAndSendExtrinsic = async (
  extrinsic: SubmittableExtrinsic<'promise'>,
  signer: Signer,
  sender: string
) => {
  try {
    const unsub = await extrinsic.signAndSend(sender, { signer }, (result) => {
      if (result.isCompleted) {
        unsub();
      }

      if (result.status.isFinalized || result.status.isInBlock) {
        result.events
          .filter(({ event: { section } }) => section === 'system')
          .forEach(({ event: { method } }): void => {
            if (method === 'ExtrinsicFailed') {
              console.log('notifyExtrinsic failed', result.txHash.toHex());
            } else if (method === 'ExtrinsicSuccess') {
              console.log('notifyExtrinsic success', result.txHash.toHex());
            }
          });
      } else if (result.isError) {
        console.log('notifyExtrinsic error', result.txHash.toHex());
      }
    });
  } catch (err) {
    console.error(err);
  } finally {
    //
  }
};
