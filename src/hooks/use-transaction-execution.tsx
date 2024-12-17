import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useConfig } from 'wagmi';
import { useWalletStore } from '@/store/wallet';
import {
  TransactionStatus,
  useTransactionHistory
} from '@/store/transaction-history';
import { signAndSendExtrinsic } from '@/services/xcm/polkadot-xcm';
import { transferFromMoonbeam } from '@/services/xcm/moonbean';
import type { ChainConfig, Asset } from '@/types/xcm-asset';
import { waitForTransactionReceipt } from '@wagmi/core';

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
  const config = useConfig()

  const { selectedWallet } = useWalletStore();

  const { addTransaction, updateTransaction } = useTransactionHistory(
    useShallow((state) => ({
      addTransaction: state.addTransaction,
      updateTransaction: state.updateTransaction
    }))
  );
  const executeTransaction = useCallback(
    async ({ extrinsic }: { extrinsic: any; }) => {
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
                  decimals: selectedToken?.decimals ?? 0,
                  status: TransactionStatus.PENDING
                });
              }
              resolve({ status: TransactionStatus.PENDING, txHash });
            },
            onSuccess: async ({ txHash }) => {
              if (txHash) {
                updateTransaction(txHash, {
                  status: TransactionStatus.COMPLETED
                });
                resolve({
                  status: TransactionStatus.COMPLETED,
                  txHash
                });
              }
            },
            onError: (error) => {
              if (txHash) {
                updateTransaction(txHash, {
                  status: TransactionStatus.FAILED
                });
              }
              reject(error);
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
    if (!sourceChain?.id || !address || !targetChain?.id || !selectedToken || !amount || !recipientAddress) {
      throw new Error('Missing required parameters for transaction');
    }
    return new Promise(async (resolve, reject) => {
      const { txHash, error, message } = await transferFromMoonbeam({
        amount,
        destinationChainId: Number(targetChain?.id),
        sourceAddress: address,
        destinationAddress: recipientAddress,
        token: selectedToken?.symbol,
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
          symbol: selectedToken?.symbol,
          status: TransactionStatus.PENDING
        });
        try {
          const transactionReceipt = await waitForTransactionReceipt(config as any, {
            chainId: sourceChain?.isEvm ? Number(sourceChain?.evmChainId) : undefined,
            hash: txHash as `0x${string}`,
          })
          console.log('transactionReceipt', transactionReceipt)
          if (transactionReceipt.status === 'success') {
            updateTransaction(txHash, {
              status: TransactionStatus.COMPLETED
            });
            resolve({ status: TransactionStatus.COMPLETED, txHash });
          } else {
            updateTransaction(txHash, {
              status: TransactionStatus.FAILED
            });
            reject(new Error('Transaction failed'));
          }
        } catch (error) {
          reject(error)
          updateTransaction(txHash, {
            status: TransactionStatus.FAILED
          });
          console.error('Error processing transaction:', error);
        }
      }
      if (error) {
        reject(new Error(message));
      }
    })
  }, [sourceChain, targetChain, selectedToken, amount, recipientAddress]);

  return {
    executeTransaction,
    executeTransactionFromMoonbeam
  };
}
