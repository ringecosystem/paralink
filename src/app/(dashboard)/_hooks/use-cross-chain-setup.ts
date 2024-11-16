import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useChainsStore from '@/store/chains';
import { getFromChains, getToChains } from '@/utils/xcm-chain-registry';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';

type SwapChainsParams = {
  chains: ChainInfoWithXcAssetsData[];
  fromChainId: string;
  toChainId: string;
};
interface UseCrossChainSetupReturn {
  setupCrossChainConfig: (
    chains: ChainInfoWithXcAssetsData[],
    initialFromId?: string
  ) => {
    fromChains: ChainInfoWithXcAssetsData[];
    fromChainId: string;
    toChains: ChainInfoWithXcAssetsData[];
    toChainId: string;
  };
  setChains: (chains: ChainInfoWithXcAssetsData[]) => void;
  swapChains: ({ chains, fromChainId, toChainId }: SwapChainsParams) => void;
}

export function useCrossChainSetup(): UseCrossChainSetupReturn {
  const {
    setChains,
    setFromChainId,
    setToChainId,
    setFromChains,
    setToChains
  } = useChainsStore(
    useShallow((state) => ({
      setChains: state.setChains,
      setFromChainId: state.setFromChainId,
      setToChainId: state.setToChainId,
      setFromChains: state.setFromChains,
      setToChains: state.setToChains
    }))
  );

  const setupCrossChainConfig = useCallback(
    (chains: ChainInfoWithXcAssetsData[], initialFromId?: string) => {
      const fromChains = getFromChains(chains);
      const fromChainId = initialFromId ? initialFromId : fromChains?.[0]?.id;

      const toChains = getToChains(chains, fromChainId);
      const toChainId = toChains?.[0]?.id ?? '';

      setFromChainId(fromChainId);
      setFromChains(fromChains);
      setToChainId(toChainId);
      setToChains(toChains);

      return {
        fromChains,
        fromChainId,
        toChains,
        toChainId
      };
    },
    [setFromChainId, setFromChains, setToChainId, setToChains]
  );

  const swapChains = useCallback(
    ({ chains, fromChainId, toChainId }: SwapChainsParams) => {
      const newFromChainId = toChainId;
      const newToChainId = fromChainId;
      const newDestParachains = getToChains(chains, newFromChainId);
      setToChains(newDestParachains);
      setFromChainId(newFromChainId);
      setToChainId(newToChainId);
    },
    [setToChains, setFromChainId, setToChainId]
  );

  return {
    setChains,
    setupCrossChainConfig,
    swapChains
  };
}
