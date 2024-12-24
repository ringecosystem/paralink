import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useChainsStore from '@/store/chains';
import { getFromChains, getToChains } from '@/utils/xcm/registry';
import type { ChainConfig } from '@/types/xcm-asset';

type SwapChainsParams = {
  chains: ChainConfig[];
  sourceChainId: number;
  targetChainId: number;
};
interface UseCrossChainSetupReturn {
  setupCrossChainConfig: (
    chains: ChainConfig[],
    initialFromId?: number
  ) => void;
  swapChains: ({
    chains,
    sourceChainId,
    targetChainId
  }: SwapChainsParams) => void;
  updateToChain: ({
    chains,
    targetChainId
  }: {
    chains: ChainConfig[];
    targetChainId: number;
  }) => void;
}
export function useCrossChainSetup(): UseCrossChainSetupReturn {
  const {
    setSourceChainId,
    targetChainId,
    setTargetChainId,
    setSourceChains,
    setTargetChains
  } = useChainsStore(
    useShallow((state) => ({
      setSourceChainId: state.setSourceChainId,
      targetChainId: state.targetChainId,
      setTargetChainId: state.setTargetChainId,
      setSourceChains: state.setSourceChains,
      setTargetChains: state.setTargetChains
    }))
  );

  const setupCrossChainConfig = useCallback(
    (chains: ChainConfig[], initialFromId?: number) => {
      try {
        const sourceChains = getFromChains(chains);
        const sourceChainId = initialFromId
          ? initialFromId
          : sourceChains?.[0]?.id;
        setSourceChainId(sourceChainId);
        setSourceChains(sourceChains);
        const targetChains = getToChains(chains, sourceChainId);
        setTargetChains(targetChains);

        let defaultToChainId = targetChainId;
        if (
          !defaultToChainId ||
          defaultToChainId === sourceChainId ||
          !targetChains?.find((chain) => chain.id === defaultToChainId)
        ) {
          defaultToChainId = targetChains?.[0]?.id ?? '';
        }

        setTargetChainId(defaultToChainId);
      } catch (error) {
        console.error(error);
      }
    },
    [
      targetChainId,
      setSourceChainId,
      setSourceChains,
      setTargetChainId,
      setTargetChains
    ]
  );

  const updateToChain = useCallback(
    async ({ targetChainId }: { targetChainId: number }) => {
      try {
        setTargetChainId(targetChainId);
      } catch (error) {
        console.error(error);
      }
    },
    [setTargetChainId]
  );

  const swapChains = useCallback(
    async ({ chains, sourceChainId, targetChainId }: SwapChainsParams) => {
      try {
        const newSourceChainId = targetChainId;
        const newTargetChainId = sourceChainId;
        const newTargetParachains = getToChains(chains, newSourceChainId);
        setTargetChains(newTargetParachains);
        setSourceChainId(newSourceChainId);
        setTargetChainId(newTargetChainId);
      } catch (error) {
        console.error(error);
      }
    },
    [setTargetChains, setSourceChainId, setTargetChainId]
  );

  return {
    setupCrossChainConfig,
    swapChains,
    updateToChain
  };
}
