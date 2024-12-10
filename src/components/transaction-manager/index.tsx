'use client';

import { useTransactionHistory } from '@/store/transaction-history';
import TransactionItem from './item';

export function TransactionManager() {
  const records = useTransactionHistory((state) => state.records);

  return records.map((tx) => <TransactionItem key={tx.txHash} tx={tx} />);
}
