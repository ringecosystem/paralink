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
  close: () => void;
}

export const useTransactionDetailStore = create<TransactionDetailStore>(
  (set) => ({
    isOpen: false,
    transaction: null,
    open: (transaction) => set({ isOpen: true, transaction }),
    close: () => set({ isOpen: false, transaction: null })
  })
);
