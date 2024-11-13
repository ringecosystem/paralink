import { create } from 'zustand';
import {
  getWallets,
  type WalletAccount,
  type Wallet,
  type BaseWalletError
} from '@talismn/connect-wallets';
import { APP_NAME } from '@/config/site';

interface WalletState {
  accounts: WalletAccount[];
  selectedAccount: WalletAccount | null;
  selectedWallet: Wallet | null;
  isConnecting: boolean;
  error: string | null;
  connectWallet: (walletId: string) => Promise<void>;
  setSelectedAccount: (account: WalletAccount) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  accounts: [],
  selectedAccount: null,
  selectedWallet: null,
  isConnecting: false,
  error: null,

  connectWallet: async (walletId: string) => {
    try {
      set({ isConnecting: true, error: null });

      const wallets = getWallets();
      const wallet = wallets.find((w) => w.extensionName === walletId);

      if (!wallet) {
        throw new Error(
          `${walletId} extension not found. Please make sure it's installed and enabled`
        );
      }

      await wallet.enable(APP_NAME);

      const accounts = await wallet.getAccounts();

      if (!accounts.length) {
        throw new Error(
          `No accounts found in ${walletId}. Please create or import an account`
        );
      }

      set({
        accounts,
        selectedAccount: accounts[0],
        selectedWallet: wallet,
        isConnecting: false
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as BaseWalletError).message || 'Failed to connect wallet';

      set({
        error: errorMessage,
        isConnecting: false
      });
      throw error;
    }
  },

  setSelectedAccount: (account) => {
    set({ selectedAccount: account });
  },

  disconnect: () => {
    set({
      accounts: [],
      selectedAccount: null,
      selectedWallet: null,
      error: null
    });
  }
}));
