import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useChainsStore from '@/store/chains';
import { getFromChains, getToChains } from '@/utils/xcm-chain-registry';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';

type SwapChainsParams = {
  chains: ChainInfoWithXcAssetsData[];
  sourceChainId: string;
  targetChainId: string;
};
interface UseCrossChainSetupReturn {
  setupCrossChainConfig: (
    chains: ChainInfoWithXcAssetsData[],
    initialFromId?: string
  ) => Promise<void>;
  swapChains: ({
    chains,
    sourceChainId,
    targetChainId
  }: SwapChainsParams) => void;
  updateToChain: ({
    chains,
    targetChainId
  }: {
    chains: ChainInfoWithXcAssetsData[];
    targetChainId: string;
  }) => void;
}
export function useCrossChainSetup(): UseCrossChainSetupReturn {
  const {
    setSourceChainId,
    targetChainId,
    setToChainId,
    setFromChains,
    setToChains
  } = useChainsStore(
    useShallow((state) => ({
      setSourceChainId: state.setSourceChainId,
      targetChainId: state.targetChainId,
      setToChainId: state.setToChainId,
      setFromChains: state.setFromChains,
      setToChains: state.setToChains
    }))
  );

  const setupCrossChainConfig = useCallback(
    async (chains: ChainInfoWithXcAssetsData[], initialFromId?: string) => {
      try {
        const fromChains = getFromChains(chains);
        const sourceChainId = initialFromId
          ? initialFromId
          : fromChains?.[0]?.id;
        setSourceChainId(sourceChainId);
        setFromChains(fromChains);
        const toChains = getToChains(chains, sourceChainId);
        setToChains(toChains);

        let defaultToChainId = targetChainId;
        if (
          !defaultToChainId ||
          defaultToChainId === sourceChainId ||
          !toChains?.find((chain) => chain.id === defaultToChainId)
        ) {
          defaultToChainId = toChains?.[0]?.id ?? '';
        }

        setToChainId(defaultToChainId);
      } catch (error) {
        console.error(error);
      }
    },
    [targetChainId, setSourceChainId, setFromChains, setToChainId, setToChains]
  );

  const updateToChain = useCallback(
    async ({ targetChainId }: { targetChainId: string }) => {
      try {
        setToChainId(targetChainId);
      } catch (error) {
        console.error(error);
      }
    },
    [setToChainId]
  );

  const swapChains = useCallback(
    async ({ chains, sourceChainId, targetChainId }: SwapChainsParams) => {
      try {
        const newFromChainId = targetChainId;
        const newToChainId = sourceChainId;
        const newDestParachains = getToChains(chains, newFromChainId);
        setToChains(newDestParachains);
        setSourceChainId(newFromChainId);
        setToChainId(newToChainId);
      } catch (error) {
        console.error(error);
      }
    },
    [setToChains, setSourceChainId, setToChainId]
  );

  return {
    setupCrossChainConfig,
    swapChains,
    updateToChain
  };
}
