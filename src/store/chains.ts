import { create } from 'zustand';
import type { ChainInfo } from '@/types/chains-info';
import type { ParaChainConfig, XcAssetData } from '@/types/asset-registry';

export interface ChainInfoWithXcAssetsData extends ChainInfo {
  id: string;
  hasXcmPayment?: boolean;
  xcAssetsData?: XcAssetData[];
  assetsInfo?: ParaChainConfig['assetsInfo'];
  nativeToken: {
    symbol: string;
    decimals: number;
    icon: string;
  };
  isEvmChain?: boolean;
}

export type ChainsState = {
  chains: ChainInfoWithXcAssetsData[];
  sourceChainId?: string;
  fromChains?: ChainInfoWithXcAssetsData[];
  targetChainId?: string;
  toChains?: ChainInfoWithXcAssetsData[];
};

export type ChainsActions = {
  setChains: (chains: ChainInfoWithXcAssetsData[]) => void;
  setSourceChainId: (chainId: string) => void;
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
    sourceChainId: undefined,
    targetChainId: undefined,
    setChains: (chains: ChainInfoWithXcAssetsData[]) => set({ chains }),
    setSourceChainId: (chainId: string) => set({ sourceChainId: chainId }),
    setFromChains: (chains: ChainInfoWithXcAssetsData[]) =>
      set({ fromChains: chains }),
    setToChainId: (chainId: string) => set({ targetChainId: chainId }),
    setToChains: (chains: ChainInfoWithXcAssetsData[]) =>
      set({ toChains: chains }),
    getChainById: (chainId?: string) => {
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
