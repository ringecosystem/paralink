import { create } from 'zustand';
import type { ChainConfig } from '@/types/registry';

export type ChainsState = {
  chains: ChainConfig[];
  sourceChainId?: number;
  sourceChains?: ChainConfig[];
  targetChainId?: number;
  targetChains?: ChainConfig[];
};

export type ChainsActions = {
  setChains: (chains: ChainConfig[]) => void;
  setSourceChainId: (chainId: number) => void;
  setSourceChains: (chains: ChainConfig[]) => void;
  setTargetChainId: (chainId: number) => void;
  setTargetChains: (chains: ChainConfig[]) => void;
};

export type ChainsSelectors = {
  getChainById: (chainId?: number) => ChainConfig | undefined;
  getFromChain: () => ChainConfig | undefined;
  getToChain: () => ChainConfig | undefined;
};

const useChainsStore = create<ChainsState & ChainsActions & ChainsSelectors>(
  (set, get) => ({
    chains: [],
    sourceChainId: undefined,
    targetChainId: undefined,
    setChains: (chains: ChainConfig[]) => set({ chains }),
    setSourceChainId: (chainId: number) => set({ sourceChainId: chainId }),
    setSourceChains: (chains: ChainConfig[]) =>
      set({ sourceChains: chains }),
    setTargetChainId: (chainId: number) => set({ targetChainId: chainId }),
    setTargetChains: (chains: ChainConfig[]) =>
      set({ targetChains: chains }),
    getChainById: (chainId?: number) => {
      if (!chainId) return undefined;
      return get().chains.find((chain) => chain.id === chainId);
    },
    getFromChain: () => {
      const { chains, sourceChainId } = get();
      return chains.find((chain) => chain.id === sourceChainId);
    },
    getToChain: () => {
      const { chains, targetChainId } = get();
      return chains.find((chain) => chain.id === targetChainId);
    }
  })
);

export default useChainsStore;
