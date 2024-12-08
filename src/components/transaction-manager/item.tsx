'use client';

import { memo, useEffect, useRef } from 'react';
import { Bounce, toast } from 'react-toastify';
import {
  TransactionStatus,
  TransactionRecord,
  useTransactionHistory
} from '@/store/transaction-history';
import { checkXcmTransaction, XcmMessageStatus } from '@/services/subscan';
import { getSubscanBaseUrl } from '@/config/subscan-api';
import { TransactionToastPending } from './transaction-toast-pending';
import { TransactionToastFinished } from './transaction-toast-finished';

const AUTO_CLOSE_TIME = 5000;

interface TransactionItemProps {
  tx: TransactionRecord;
}

function TransactionItem({ tx }: TransactionItemProps) {
  const toastIdRef = useRef<string | number>();
  const updateTransaction = useTransactionHistory(
    (state) => state.updateTransaction
  );

  useEffect(() => {
    async function processTransaction() {
      const isSubscanSupported = Boolean(getSubscanBaseUrl(tx.sourceChainId));
      if (
        tx?.status === TransactionStatus.COMPLETED ||
        tx?.status === TransactionStatus.FAILED
      ) {
        return;
      }
      console.log('processTransaction', tx);
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
      if (
        toastIdRef.current &&
        isSubscanSupported &&
        (tx.status === TransactionStatus.SOURCE_CONFIRMED ||
          tx.status === TransactionStatus.PENDING)
      ) {
        try {
          const result = await checkXcmTransaction({
            hash: tx.txHash,
            paraId: tx.sourceChainId
          });
          if (result.status === XcmMessageStatus.SUCCESS) {
            updateTransaction(tx.txHash, {
              status: TransactionStatus.COMPLETED,
              uniqueId: result.hash
            });
            if (toastIdRef.current) {
              toast.update(toastIdRef.current, {
                render: <TransactionToastFinished txHash={tx.txHash} />,
                type: 'success',
                isLoading: false,
                autoClose: AUTO_CLOSE_TIME,
                closeButton: true,
                progress: undefined,
                transition: Bounce
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
                transition: Bounce
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
        tx.status !== TransactionStatus.SOURCE_CONFIRMED
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
            transition: Bounce
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
  }, [tx, updateTransaction]);

  return null;
}
export default memo(TransactionItem);
