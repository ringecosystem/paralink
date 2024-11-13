import { create } from 'zustand';
import type { ChainInfo } from '@/types/chains-info';
import type { XcAssetData } from '@/types/asset-registry';

export interface ChainInfoWithXcAssetsData extends ChainInfo {
  id: string;
  xcAssetsData?: XcAssetData[];
  isEvmChain?: boolean;
}

export type ChainsState = {
  chains: ChainInfoWithXcAssetsData[];
  fromChainId?: string;
  fromChains?: ChainInfoWithXcAssetsData[];
  toChainId?: string;
  toChains?: ChainInfoWithXcAssetsData[];
};

export type ChainsActions = {
  setChains: (chains: ChainInfoWithXcAssetsData[]) => void;
  setFromChainId: (chainId: string) => void;
  setFromChains: (chains: ChainInfoWithXcAssetsData[]) => void;
  setToChainId: (chainId: string) => void;
  setToChains: (chains: ChainInfoWithXcAssetsData[]) => void;
};

export type ChainsSelectors = {
  getChainById: (chainId?: string) => ChainInfoWithXcAssetsData | undefined;
  getFromChain: () => ChainInfoWithXcAssetsData | undefined;
  getToChain: () => ChainInfoWithXcAssetsData | undefined;
};

const useChainsStore = create<ChainsState & ChainsActions & ChainsSelectors>(
  (set, get) => ({
    chains: [],
    fromChainId: undefined,
    toChainId: undefined,
    setChains: (chains: ChainInfoWithXcAssetsData[]) => set({ chains }),
    setFromChainId: (chainId: string) => set({ fromChainId: chainId }),
    setFromChains: (chains: ChainInfoWithXcAssetsData[]) =>
      set({ fromChains: chains }),
    setToChainId: (chainId: string) => set({ toChainId: chainId }),
    setToChains: (chains: ChainInfoWithXcAssetsData[]) =>
      set({ toChains: chains }),
    getChainById: (chainId?: string) => {
      if (!chainId) return undefined;
      return get().chains.find((chain) => chain.id === chainId);
    },
    getFromChain: () => {
      const { chains, fromChainId } = get();
      return chains.find((chain) => chain.id === fromChainId);
    },
    getToChain: () => {
      const { chains, toChainId } = get();
      return chains.find((chain) => chain.id === toChainId);
    }
  })
);

export default useChainsStore;
