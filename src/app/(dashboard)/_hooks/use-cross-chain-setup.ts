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
    async (chains: ChainInfoWithXcAssetsData[], initialFromId?: string) => {
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
    async ({ targetChainId }: { targetChainId: string }) => {
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
        const newFromChainId = targetChainId;
        const newToChainId = sourceChainId;
        const newDestParachains = getToChains(chains, newFromChainId);
        setTargetChains(newDestParachains);
        setSourceChainId(newFromChainId);
        setTargetChainId(newToChainId);
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
