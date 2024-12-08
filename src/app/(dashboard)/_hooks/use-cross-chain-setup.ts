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
  ) => Promise<void>;
  swapChains: ({ chains, fromChainId, toChainId }: SwapChainsParams) => void;
  updateToChain: ({
    chains,
    toChainId
  }: {
    chains: ChainInfoWithXcAssetsData[];
    toChainId: string;
  }) => void;
}
export function useCrossChainSetup(): UseCrossChainSetupReturn {
  const {
    setFromChainId,
    toChainId,
    setToChainId,
    setFromChains,
    setToChains
  } = useChainsStore(
    useShallow((state) => ({
      setFromChainId: state.setFromChainId,
      toChainId: state.toChainId,
      setToChainId: state.setToChainId,
      setFromChains: state.setFromChains,
      setToChains: state.setToChains
    }))
  );

  const setupCrossChainConfig = useCallback(
    async (chains: ChainInfoWithXcAssetsData[], initialFromId?: string) => {
      try {
        const fromChains = getFromChains(chains);
        const fromChainId = initialFromId ? initialFromId : fromChains?.[0]?.id;
        setFromChainId(fromChainId);
        setFromChains(fromChains);
        const toChains = getToChains(chains, fromChainId);
        setToChains(toChains);

        let defaultToChainId = toChainId;
        if (
          !defaultToChainId ||
          defaultToChainId === fromChainId ||
          !toChains?.find((chain) => chain.id === defaultToChainId)
        ) {
          defaultToChainId = toChains?.[0]?.id ?? '';
        }

        setToChainId(defaultToChainId);
      } catch (error) {
        console.error(error);
      }
    },
    [toChainId, setFromChainId, setFromChains, setToChainId, setToChains]
  );

  const updateToChain = useCallback(
    async ({ toChainId }: { toChainId: string }) => {
      try {
        setToChainId(toChainId);
      } catch (error) {
        console.error(error);
      }
    },
    [setToChainId]
  );

  const swapChains = useCallback(
    async ({ chains, fromChainId, toChainId }: SwapChainsParams) => {
      try {
        const newFromChainId = toChainId;
        const newToChainId = fromChainId;
        const newDestParachains = getToChains(chains, newFromChainId);
        setToChains(newDestParachains);
        setFromChainId(newFromChainId);
        setToChainId(newToChainId);
      } catch (error) {
        console.error(error);
      }
    },
    [setToChains, setFromChainId, setToChainId]
  );

  return {
    setupCrossChainConfig,
    swapChains,
    updateToChain
  };
}
