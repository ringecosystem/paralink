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
  sourceChain?: ChainInfoWithXcAssetsData;
  targetChain?: ChainInfoWithXcAssetsData;
  selectedToken?: AvailableToken;
  amount: string;
  recipientAddress: string;
}

export function useTransactionExecution({
  sourceChain,
  targetChain,
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
      if (!extrinsic || !sourceChain?.id || !selectedWallet?.signer || !address)
        return;

      return new Promise((resolve, reject) => {
        signAndSendExtrinsic({
          extrinsic,
          signer: selectedWallet.signer,
          sender: address,
          onPending({ txHash }) {
            if (sourceChain && targetChain) {
              addTransaction({
                txHash,
                sourceChainId: Number(sourceChain?.id),
                sourceAddress: address,
                targetChainId: Number(targetChain?.id),
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
      sourceChain,
      targetChain,
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
