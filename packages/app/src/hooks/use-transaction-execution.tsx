import { useCallback, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useConfig } from 'wagmi';
import { useWalletStore } from '@/store/wallet';
import {
  TransactionStatus,
  useTransactionHistory
} from '@/store/transaction-history';
import { Slide, toast } from 'react-toastify';
import { signAndSendExtrinsic } from '@/services/xcm/polkadot-xcm';
import { transferFromMoonbeam } from '@/services/xcm/moonbean';
import { waitForTransactionReceipt } from '@wagmi/core';
import { TransactionToastPending } from '@/components/transaction-manager/transaction-toast-pending';
import { TransactionToastFinished } from '@/components/transaction-manager/transaction-toast-finished';
import { CROSS_CHAIN_TRANSFER_ESTIMATED_TIME } from '@/config/blockTime';
import { calculateAndWaitRemainingTime } from '@/utils/date';
import type { ChainConfig, Asset } from '@/types/xcm-asset';

const AUTO_CLOSE_TIME = 5000;

const showPendingToast = (txHash: string) => {
  return toast.loading(<TransactionToastPending txHash={txHash} />, {
    position: 'bottom-right',
    closeButton: true,
    autoClose: AUTO_CLOSE_TIME
  });
};

const showSuccessToast = (txHash: string, toastId?: string | number) => {
  if (toastId && toast.isActive(toastId)) {
    toast.update(toastId, {
      render: <TransactionToastFinished txHash={txHash} />,
      type: 'success',
      isLoading: false,
      autoClose: AUTO_CLOSE_TIME,
      closeButton: true,
      progress: undefined,
      transition: Slide
    });
  } else {
    toast.success(<TransactionToastFinished txHash={txHash} />, {
      position: 'bottom-right',
      closeButton: true,
      autoClose: AUTO_CLOSE_TIME
    });
  }
};

const showErrorToast = (txHash: string, toastId?: string | number) => {
  if (toastId && toast.isActive(toastId)) {
    toast.update(toastId, {
      render: <TransactionToastFinished txHash={txHash} />,
      type: 'error',
      isLoading: false,
      autoClose: AUTO_CLOSE_TIME,
      closeButton: true,
      progress: undefined,
      transition: Slide
    });
  } else {
    toast.error(<TransactionToastFinished txHash={txHash} />, {
      position: 'bottom-right',
      closeButton: true,
      autoClose: AUTO_CLOSE_TIME
    });
  }
};

interface UseTransactionExecutionProps {
  address?: string;
  sourceChain?: ChainConfig;
  targetChain?: ChainConfig;
  selectedToken?: Asset;
  amount: string;
  recipientAddress: string;
}

export function useTransactionExecution({
  address,
  sourceChain,
  targetChain,
  selectedToken,
  amount,
  recipientAddress
}: UseTransactionExecutionProps) {
  const toastIdRef = useRef<string | number>();
  const config = useConfig();

  const { selectedWallet } = useWalletStore();

  const { addTransaction, updateTransaction } = useTransactionHistory(
    useShallow((state) => ({
      addTransaction: state.addTransaction,
      updateTransaction: state.updateTransaction
    }))
  );

  const executeTransaction = useCallback(
    async ({ extrinsic }: { extrinsic: any }) => {
      if (
        !extrinsic ||
        !sourceChain?.id ||
        !selectedWallet?.signer ||
        !address
      ) {
        throw new Error('Missing required parameters for transaction');
      }
      let txHash: string | undefined;
      return new Promise((resolve, reject) => {
        try {
          signAndSendExtrinsic({
            extrinsic,
            signer: selectedWallet.signer,
            sender: address,
            onPending({ txHash }) {
              txHash = txHash;
              if (sourceChain && targetChain) {
                addTransaction({
                  txHash,
                  sourceChainId: Number(sourceChain?.id),
                  sourceAddress: address,
                  targetChainId: Number(targetChain?.id),
                  targetAddress: recipientAddress,
                  amount,
                  symbol: selectedToken?.symbol ?? '',
                  decimals: selectedToken?.decimals ?? 0
                });
                toastIdRef.current = showPendingToast(txHash);
              }
              resolve({ status: TransactionStatus.PENDING, txHash });
            },
            onSuccess: async ({ txHash }) => {
              console.log('transaction success', txHash);
              if (txHash) {
                showSuccessToast(txHash, toastIdRef.current);
                toastIdRef.current = undefined;
                resolve({
                  status: TransactionStatus.COMPLETED,
                  txHash
                });
              }
            },
            onError: (error) => {
              console.log('transaction error', error);
              if (txHash) {
                showErrorToast(txHash, toastIdRef.current);
                toastIdRef.current = undefined;
              }
              resolve({ status: TransactionStatus.FAILED, txHash });
            }
          });
        } catch (error) {
          reject(error);
        }
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

  const executeTransactionFromMoonbeam = useCallback(async () => {
    if (
      !sourceChain?.id ||
      !address ||
      !targetChain?.id ||
      !selectedToken ||
      !amount ||
      !recipientAddress
    ) {
      throw new Error('Missing required parameters for transaction');
    }
    return new Promise(async (resolve, reject) => {
      const { txHash, error, message } = await transferFromMoonbeam({
        amount,
        destinationChainId: Number(targetChain?.id),
        sourceAddress: address,
        destinationAddress: recipientAddress,
        token: selectedToken?.symbol
      });
      if (txHash) {
        addTransaction({
          txHash,
          decimals: selectedToken?.decimals ?? 0,
          sourceChainId: 2004,
          sourceAddress: address,
          targetChainId: Number(targetChain?.id),
          targetAddress: recipientAddress,
          amount,
          symbol: selectedToken?.symbol
        });
        toastIdRef.current = showPendingToast(txHash);

        try {
          const startTime = Date.now();
          const transactionReceipt = await waitForTransactionReceipt(
            config as any,
            {
              chainId: sourceChain?.isEvm
                ? Number(sourceChain?.evmChainId)
                : undefined,
              hash: txHash as `0x${string}`
            }
          );
          console.log('transactionReceipt', transactionReceipt);
          if (transactionReceipt.status === 'success') {
            showSuccessToast(txHash, toastIdRef.current);
            toastIdRef.current = undefined;
            await calculateAndWaitRemainingTime(
              startTime,
              CROSS_CHAIN_TRANSFER_ESTIMATED_TIME
            );

            resolve({ status: TransactionStatus.COMPLETED, txHash });
          } else {
            showErrorToast(txHash, toastIdRef.current);
            toastIdRef.current = undefined;
            resolve({ status: TransactionStatus.FAILED, txHash });
          }
        } catch (error) {
          showErrorToast(txHash, toastIdRef.current);
          toastIdRef.current = undefined;
          resolve({ status: TransactionStatus.FAILED, txHash });
          console.error('Error processing transaction:', error);
        }
      }
      if (error) {
        reject(new Error(message));
      }
    });
  }, [sourceChain, targetChain, selectedToken, amount, recipientAddress]);

  return {
    executeTransaction,
    executeTransactionFromMoonbeam
  };
}
