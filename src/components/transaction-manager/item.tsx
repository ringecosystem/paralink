'use client';

import { memo, useEffect, useRef } from 'react';
import { Slide, toast } from 'react-toastify';
import {
  TransactionStatus,
  TransactionRecord,
  useTransactionHistory
} from '@/store/transaction-history';
import { getXcmMessageHash, XcmMessageStatus } from '@/services/subscan';
import { getSubscanBaseUrl } from '@/config/subscan-api';
import { TransactionToastPending } from './transaction-toast-pending';
import { TransactionToastFinished } from './transaction-toast-finished';
import useChainsStore from '@/store/chains';
import { useWaitForTransactionReceipt } from 'wagmi';

const AUTO_CLOSE_TIME = 5000;

interface TransactionItemProps {
  tx: TransactionRecord;
}

function TransactionItem({ tx }: TransactionItemProps) {
  const toastIdRef = useRef<string | number>();
  const updateTransaction = useTransactionHistory(
    (state) => state.updateTransaction
  );
  const sourceChain = useChainsStore((state) => state.chains).find(
    (chain) => chain.id?.toString() === tx.sourceChainId?.toString()
  );

  const { data: evmTxData, isSuccess: evmTxSuccess, isError: evmTxError } = useWaitForTransactionReceipt({
    hash: sourceChain?.isEvm ? (tx.txHash as `0x${string}`) : undefined,
    chainId: sourceChain?.isEvm ? Number(sourceChain?.evmChainId) : undefined,
    query: {
      enabled: Boolean(sourceChain?.isEvm) && !!sourceChain?.evmChainId && tx?.status === TransactionStatus.PENDING && !!tx?.txHash
    }
  });



  useEffect(() => {
    try {
      if (
        tx?.status === TransactionStatus.COMPLETED ||
        tx?.status === TransactionStatus.FAILED
      ) {
        return;
      }
      if (!toastIdRef.current && tx.status === TransactionStatus.PENDING) {
        const toastId = toast.loading(
          <TransactionToastPending txHash={tx.txHash} />,
          {
            position: 'bottom-right',
            closeButton: true,
            autoClose: AUTO_CLOSE_TIME
          }
        );
        toastIdRef.current = toastId;
      }

      if (sourceChain?.isEvm) {
        if (evmTxSuccess || evmTxError) {
          if (evmTxData?.transactionHash) {
            updateTransaction(tx.txHash, {
              status: TransactionStatus.COMPLETED,
            });
            if (toastIdRef.current) {
              toast.update(toastIdRef.current, {
                render: <TransactionToastFinished txHash={tx.txHash} />,
                type: 'success',
                isLoading: false,
                autoClose: AUTO_CLOSE_TIME,
                closeButton: true,
                progress: undefined,
                transition: Slide
              });
              toastIdRef.current = undefined;
            }
          } else {
            updateTransaction(tx.txHash, {
              status: TransactionStatus.FAILED
            });
            if (toastIdRef.current) {
              toast.update(toastIdRef.current, {
                render: <TransactionToastFinished txHash={tx.txHash} />,
                type: 'error',
                isLoading: false,
                autoClose: AUTO_CLOSE_TIME,
                closeButton: true,
                progress: undefined,
                transition: Slide
              });
            }
          }
        }
      } else {
        async function processTransaction() {
          const isSubscanSupported = Boolean(getSubscanBaseUrl(tx.sourceChainId));
          if (
            toastIdRef.current &&
            isSubscanSupported &&
            tx.status === TransactionStatus.PENDING
          ) {
            try {
              const xcmResult = await getXcmMessageHash({
                hash: tx.txHash,
                paraId: tx.sourceChainId,
              });
              if (xcmResult.status === XcmMessageStatus.SUCCESS) {
                updateTransaction(tx.txHash, {
                  status: TransactionStatus.COMPLETED,
                });
                if (toastIdRef.current) {
                  toast.update(toastIdRef.current, {
                    render: <TransactionToastFinished txHash={tx.txHash} />,
                    type: 'success',
                    isLoading: false,
                    autoClose: AUTO_CLOSE_TIME,
                    closeButton: true,
                    progress: undefined,
                    transition: Slide
                  });
                  toastIdRef.current = undefined;
                }
              } else {
                await updateTransaction(tx.txHash, {
                  status: TransactionStatus.FAILED
                });
                if (toastIdRef.current) {
                  toast.update(toastIdRef.current, {
                    render: <TransactionToastFinished txHash={tx.txHash} />,
                    type: 'error',
                    isLoading: false,
                    autoClose: AUTO_CLOSE_TIME,
                    closeButton: true,
                    progress: undefined,
                    transition: Slide
                  });
                  toastIdRef.current = undefined;
                }
              }
            } catch (error) {
              console.error(`Error processing transaction ${tx.txHash}:`, error);
            }
            return;
          }

          if (
            !isSubscanSupported &&
            toastIdRef.current &&
            tx.status !== TransactionStatus.COMPLETED
          ) {
            updateTransaction(tx.txHash, {
              status: TransactionStatus.COMPLETED
            });
            if (toast.isActive(toastIdRef.current)) {
              toast.update(toastIdRef.current, {
                render: <TransactionToastFinished txHash={tx.txHash} />,
                type: 'success',
                isLoading: false,
                autoClose: AUTO_CLOSE_TIME,
                closeButton: true,
                progress: undefined,
                transition: Slide
              });
            } else {
              toast.success(<TransactionToastFinished txHash={tx.txHash} />, {
                closeButton: true,
                autoClose: AUTO_CLOSE_TIME
              });
            }
            toastIdRef.current = undefined;
            return;
          }
        }

        processTransaction();
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
    }


  }, [tx, sourceChain?.isEvm, updateTransaction, evmTxData, evmTxSuccess, evmTxError]);

  return null;
}
export default memo(TransactionItem);
