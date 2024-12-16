'use client';

import { HistoryItem } from './history-item';
import { ScrollArea } from '../ui/scroll-area';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { History as IconHistory } from 'lucide-react';
import {
  TransactionRecord,
  useTransactionHistory
} from '@/store/transaction-history';
import { useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { useState } from 'react';

const ITEMS_PER_PAGE = 30;
export const History = () => {
  const { evmAddress, baseSubstrateAddress } = useWalletConnection();
  const records = useTransactionHistory((state) => state.records);
  const [page, setPage] = useState(1);

  const transactions = useMemo(() => {
    if (records.length === 0) return [];
    const data: TransactionRecord[] = [];
    if (evmAddress) {
      const evmTransactions = records.filter(
        (tx) => tx.sourceAddress.toLowerCase() === evmAddress.toLowerCase()
      );
      data.push(...evmTransactions);
    }
    if (baseSubstrateAddress) {
      const substrateTransactions = records.filter(
        (tx) =>
          tx.sourceAddress.toLowerCase() === baseSubstrateAddress.toLowerCase()
      );
      data.push(...substrateTransactions);
    }
    return data?.sort((a, b) => b.createTime - a.createTime);
  }, [evmAddress, baseSubstrateAddress, records]);

  const paginatedTransactions = useMemo(() => {
    return transactions.slice(0, page * ITEMS_PER_PAGE);
  }, [transactions, page]);

  const hasMore = transactions.length > page * ITEMS_PER_PAGE;

  useEffect(() => {
    return () => {
      setPage(1);
    };
  }, []);

  return (
    <div className="flex w-full flex-col">
      {transactions.length === 0 ? (
        <div className="flex h-[150px] w-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <IconHistory className="h-12 w-12 opacity-50" />
          <p className="text-[12px] font-normal leading-normal text-[#121619]">
            No transaction history
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="flex flex-col gap-[10px] pr-[10px]">
            {paginatedTransactions.map((tx) => (
              <HistoryItem key={tx.id} {...tx} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-normal text-muted-foreground hover:text-foreground"
                onClick={() => setPage((p) => p + 1)}
              >
                Load more
              </Button>
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
};
