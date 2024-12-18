import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { StorageKeys } from '@/config/storage-keys';
import { storage } from '@/utils/storage';

export const enum TransactionStatus {
  PENDING = 'PENDING',
  // SOURCE_CONFIRMED = 'SOURCE_CONFIRMED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface TransactionRecord {
  id: string;
  txHash: string;
  uniqueId?: string;
  createTime: number;
  status: TransactionStatus;

  sourceChainId: number;
  sourceAddress: string;

  targetChainId: number;
  targetAddress: string;

  amount: string;
  symbol: string;
  decimals: number;
}
export type UpdateTransactionType = (
  txHash: string,
  updates: Partial<TransactionRecord>
) => void;
interface TransactionHistoryState {
  records: TransactionRecord[];
  addTransaction: (tx: Omit<TransactionRecord, 'id' | 'createTime'>) => void;
  updateTransaction: UpdateTransactionType;
  getTransactionByTxHash: (txHash: string) => TransactionRecord | undefined;
  clearHistory: () => void;
  getTransactionsBySourceAddress: (address: string) => TransactionRecord[];
}

export const useTransactionHistory = create<TransactionHistoryState>()(
  persist(
    (set, get) => ({
      records: [],

      addTransaction: (tx) => {
        set((state) => ({
          records: [
            {
              ...tx,
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              createTime: Date.now()
            },
            ...state.records
          ]
        }));
      },

      updateTransaction: (txHash, updates) => {
        set((state) => ({
          records: state.records.map((record) =>
            record.txHash === txHash ? { ...record, ...updates } : record
          )
        }));
      },

      getTransactionByTxHash: (txHash) => {
        const { records } = get();
        return records.find((tx) => tx.txHash === txHash);
      },

      clearHistory: () => {
        set({ records: [] });
      },

      getTransactionsBySourceAddress: (address) => {
        const { records } = get();
        return records.filter(
          (tx) => tx.sourceAddress.toLowerCase() === address.toLowerCase()
        );
      }
    }),

    {
      name: StorageKeys.TRANSACTION,
      storage: createJSONStorage(() => storage)
    }
  )
);
