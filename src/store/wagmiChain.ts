import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Chain } from 'wagmi/chains';

interface WagmiChainState {
  currentChain: Chain | null;
  setChain: (chain: Chain) => void;
}

export const useWagmiChainStore = create<WagmiChainState>()(
  persist(
    (set) => ({
      currentChain: null,
      setChain: (chain) => set({ currentChain: chain })
    }),
    {
      name: 'chain-storage'
    }
  )
);
