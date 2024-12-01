import { useCallback } from 'react';
import { useWalletStore } from '@/store/wallet';
import { useTransactionDetailStore } from '@/store/transaction-detail';
import { useTransactionHistory } from '@/store/transaction-history';
import { signAndSendExtrinsic } from '@/services/xcm/polkadot-xcm';
import { formatBridgeTransactionTimestamp } from '@/utils/date';
import { TransactionToastDetail } from '@/components/transaction-toast-detail';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';
import type { AvailableToken } from '@/utils/xcm-token';
import { useShallow } from 'zustand/react/shallow';
import { toast as sonnerToast } from 'sonner';

interface UseTransactionExecutionProps {
  fromChain?: ChainInfoWithXcAssetsData;
  toChain?: ChainInfoWithXcAssetsData;
  selectedToken?: AvailableToken;
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
  const { addTransaction, updateTransaction } = useTransactionHistory(
    useShallow((state) => ({
      addTransaction: state.addTransaction,
      updateTransaction: state.updateTransaction
    }))
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
          onStart: ({ txHash }) => {
            if (fromChain && toChain) {
              addTransaction({
                txHash,
                sourceChainId: Number(fromChain?.id),
                sourceAddress: address,
                targetChainId: Number(toChain?.id),
                targetAddress: recipientAddress,
                amount,
                symbol: selectedToken?.symbol ?? '',
                decimals: selectedToken?.decimals ?? 0,
                status: 'in-progress'
              });
              sonnerToast(<TransactionToastDetail txHash={txHash} />);
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
          onSuccess: ({ txHash, messageHash, uniqueId }) => {
            updateTransaction(txHash, {
              status: uniqueId ? 'done' : 'in-progress',
              messageHash,
              uniqueId
            });
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
      openTransactionDetail,
      addTransaction,
      updateTransaction
    ]
  );

  return {
    executeTransaction
  };
}
