import { useCallback, useRef } from 'react';
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
import { TransactionDetail } from '@/components/transaction-detail';
import { CROSS_CHAIN_TRANSFER_ESTIMATED_TIME } from '@/config/blockTime';
import { calculateAndWaitRemainingTime } from '@/utils/date';
import type { ChainConfig, Asset } from '@/types/xcm-asset';
import { useSendTransaction } from 'wagmi';
import { isNil } from 'lodash-es';
import { DARWINIA_EVM_CONTRACT_ADDRESS } from '@/config/evmContractAddress';
import { u8aToHex } from '@polkadot/util';

const AUTO_CLOSE_TIME = 5_000;

const showPendingToast = (txHash: string) => {
  return toast.loading(<TransactionDetail txHash={txHash} status="pending" />, {
    position: 'top-right',
    closeButton: true,
    autoClose: AUTO_CLOSE_TIME
  });
};

const showSuccessToast = (txHash: string, toastId?: string | number) => {
  if (toastId && toast.isActive(toastId)) {
    toast.update(toastId, {
      render: <TransactionDetail txHash={txHash} status="finished" />,
      type: 'success',
      isLoading: false,
      autoClose: AUTO_CLOSE_TIME,
      closeButton: true,
      progress: undefined,
      transition: Slide
    });
  } else {
    toast.success(<TransactionDetail txHash={txHash} status="finished" />, {
      position: 'top-right',
      closeButton: true,
      autoClose: AUTO_CLOSE_TIME
    });
  }
};

const showErrorToast = (txHash: string, toastId?: string | number) => {
  if (toastId && toast.isActive(toastId)) {
    toast.update(toastId, {
      render: <TransactionDetail txHash={txHash} status="finished" />,
      type: 'error',
      isLoading: false,
      autoClose: AUTO_CLOSE_TIME,
      closeButton: true,
      progress: undefined,
      transition: Slide
    });
  } else {
    toast.error(<TransactionDetail txHash={txHash} status="finished" />, {
      position: 'top-right',
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
  const { sendTransactionAsync, error: sendTransactionError } =
    useSendTransaction();

  const { selectedWallet } = useWalletStore();

  const addTransaction = useTransactionHistory((state) => state.addTransaction);

  const executeTransactionFromDarwinia = useCallback(
    async ({
      extrinsic,
      onSuccessImmediate
    }: {
      extrinsic: any;
      onSuccessImmediate: () => void;
    }) => {
      if (
        isNil(sourceChain?.id) ||
        !address ||
        isNil(targetChain?.id) ||
        !selectedToken ||
        !amount ||
        !recipientAddress
      ) {
        throw new Error('Missing required parameters for transaction');
      }
      return new Promise(async (resolve, reject) => {
        const txHash = await sendTransactionAsync({
          to: DARWINIA_EVM_CONTRACT_ADDRESS as `0x${string}`,
          data: u8aToHex(extrinsic.method.toU8a())
        });
        if (txHash) {
          onSuccessImmediate?.();
          addTransaction({
            txHash,
            decimals: selectedToken?.decimals ?? 0,
            sourceChainId: 2046,
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
              await calculateAndWaitRemainingTime(
                startTime,
                CROSS_CHAIN_TRANSFER_ESTIMATED_TIME
              );
              showSuccessToast(txHash, toastIdRef.current);
              toastIdRef.current = undefined;
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
        if (sendTransactionError) {
          reject(sendTransactionError);
        }
      });
    },
    [
      address,
      sendTransactionAsync,
      sendTransactionError,
      sourceChain,
      targetChain,
      selectedToken,
      amount,
      recipientAddress,
      addTransaction,
      config
    ]
  );

  const executeTransaction = useCallback(
    async ({
      extrinsic,
      onSuccessImmediate
    }: {
      extrinsic: any;
      onSuccessImmediate: () => void;
    }) => {
      if (
        !extrinsic ||
        isNil(sourceChain?.id) ||
        !selectedWallet?.signer ||
        !address
      ) {
        throw new Error('Missing required parameters for transaction');
      }
      return new Promise((resolve, reject) => {
        try {
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
                  decimals: selectedToken?.decimals ?? 0
                });
                toastIdRef.current = showPendingToast(txHash);
              }
            },
            onSuccessImmediate: async ({ txHash }) => {
              onSuccessImmediate?.();
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
            onFailure: ({ txHash }) => {
              if (txHash) {
                showErrorToast(txHash, toastIdRef.current);
                toastIdRef.current = undefined;
              }
              resolve({ status: TransactionStatus.FAILED, txHash });
            },
            onError: (error) => {
              console.log('transaction error', error);
              reject(error);
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    },
    [
      address,
      selectedWallet,
      sourceChain,
      targetChain,
      amount,
      selectedToken,
      recipientAddress,
      addTransaction
    ]
  );

  const executeTransactionFromMoonbeam = useCallback(
    async ({ onSuccessImmediate }: { onSuccessImmediate: () => void }) => {
      console.log('executeTransactionFromMoonbeam', sourceChain, targetChain);
      if (
        isNil(sourceChain?.id) ||
        !address ||
        isNil(targetChain?.id) ||
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
          onSuccessImmediate?.();
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
              await calculateAndWaitRemainingTime(
                startTime,
                CROSS_CHAIN_TRANSFER_ESTIMATED_TIME
              );
              showSuccessToast(txHash, toastIdRef.current);
              toastIdRef.current = undefined;
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
          reject(message);
        }
      });
    },
    [
      address,
      sourceChain,
      targetChain,
      selectedToken,
      amount,
      recipientAddress,
      addTransaction,
      config
    ]
  );

  return {
    executeTransaction,
    executeTransactionFromDarwinia,
    executeTransactionFromMoonbeam
  };
}
