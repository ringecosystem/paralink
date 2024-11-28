import { useCallback } from 'react';
import { useWalletStore } from '@/store/wallet';
import { useTransactionDetailStore } from '@/store/transaction-detail';
import { signAndSendExtrinsic } from '@/services/xcm/polkadot-xcm';
import { formatBridgeTransactionTimestamp } from '@/utils/date';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';
import { AvailableTokens } from '@/utils/xcm-token';

interface UseTransactionExecutionProps {
  fromChain?: ChainInfoWithXcAssetsData;
  toChain?: ChainInfoWithXcAssetsData;
  selectedToken?: AvailableTokens;
  amount: string;
  recipientAddress: string;
}

export function useTransactionExecution({
  fromChain,
  toChain,
  selectedToken,
  amount,
  recipientAddress
}: UseTransactionExecutionProps) {
  const { selectedWallet } = useWalletStore();
  const openTransactionDetail = useTransactionDetailStore(
    (state) => state.open
  );

  const executeTransaction = useCallback(
    async ({ extrinsic, address }: { extrinsic: any; address: string }) => {
      if (!extrinsic || !selectedWallet?.signer || !address) return;

      const timestamp = formatBridgeTransactionTimestamp();

      return new Promise((resolve, reject) => {
        signAndSendExtrinsic({
          extrinsic,
          signer: selectedWallet.signer,
          sender: address,
          onPending: (txHash) => {
            if (fromChain && toChain) {
              openTransactionDetail({
                timestamp,
                amount: `${amount} ${selectedToken?.symbol}`,
                fromAddress: address,
                toAddress: recipientAddress,
                fromChain,
                toChain,
                fromTxHash: txHash,
                toTxHash: ''
              });
            }
          },
          onSuccess: (txHash) => {
            resolve(txHash);
          },
          onError: (error) => {
            reject(error);
          }
        });
      });
    },
    [
      selectedWallet,
      fromChain,
      toChain,
      amount,
      selectedToken,
      recipientAddress,
      openTransactionDetail
    ]
  );

  return {
    executeTransaction
  };
}
