import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWalletStore } from '@/store/wallet';
import {
  TransactionStatus,
  useTransactionHistory
} from '@/store/transaction-history';
import { signAndSendExtrinsic } from '@/services/xcm/polkadot-xcm';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';
import type { AvailableToken } from '@/utils/xcm-token';

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

  const { addTransaction, updateTransaction } = useTransactionHistory(
    useShallow((state) => ({
      addTransaction: state.addTransaction,
      updateTransaction: state.updateTransaction
    }))
  );
  const executeTransaction = useCallback(
    async ({ extrinsic, address }: { extrinsic: any; address: string }) => {
      if (!extrinsic || !fromChain?.id || !selectedWallet?.signer || !address)
        return;

      return new Promise((resolve, reject) => {
        signAndSendExtrinsic({
          extrinsic,
          signer: selectedWallet.signer,
          sender: address,
          onPending({ txHash }) {
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
                status: TransactionStatus.PENDING
              });
            }
          },
          onSuccess: async ({ txHash }) => {
            updateTransaction(txHash, {
              status: TransactionStatus.SOURCE_CONFIRMED
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
      addTransaction,
      updateTransaction
    ]
  );

  return {
    executeTransaction
  };
}
