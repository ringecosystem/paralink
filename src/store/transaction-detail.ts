import { create } from 'zustand';
import type { ChainInfoWithXcAssetsData } from './chains';

interface Transaction {
  timestamp: string;
  amount: string;
  fromAddress: string;
  toAddress: string;
  fromChain: ChainInfoWithXcAssetsData;
  toChain: ChainInfoWithXcAssetsData;
  fromTxHash: string;
  toTxHash?: string;
}

interface TransactionDetailStore {
  isOpen: boolean;
  transaction: Transaction | null;
  open: (transaction: Transaction) => void;
  update: (newTransaction: Partial<Transaction>) => void;
  close: () => void;
}

export const useTransactionDetailStore = create<TransactionDetailStore>(
  (set, get) => ({
    isOpen: false,
    transaction: null,
    open: (transaction) => set({ isOpen: true, transaction }),
    update: (newTransaction) => {
      if (!get().transaction) return;
      set((state) => ({
        transaction: {
          ...state?.transaction,
          ...newTransaction
        } as Transaction
      }));
    },
    close: () => set({ isOpen: false, transaction: null })
  })
);
