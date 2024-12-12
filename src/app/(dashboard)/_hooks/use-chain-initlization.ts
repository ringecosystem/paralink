import { useEffect, useRef, useState } from 'react';
import { useCrossChainSetup } from './use-cross-chain-setup';
import useChainsStore from '@/store/chains';
import type { ChainRegistry } from '@/types/registry';

interface UseChainInitializationProps {
  registryAssets: ChainRegistry;
}
export function useChainInitialization({
  registryAssets
}: UseChainInitializationProps) {
  const hasInitialized = useRef(false);
  const { setupCrossChainConfig } = useCrossChainSetup();
  const setChains = useChainsStore((state) => state.setChains);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    if (!registryAssets) return;
    const chains = Object.entries(registryAssets).map(([chainId, chain]) => ({
      ...chain,
      id: Number(chainId)
    }));
    setChains(chains);
    setupCrossChainConfig(chains);
  }, [setChains, setupCrossChainConfig, registryAssets]);
}

export type ChainInitializationReturn = ReturnType<
  typeof useChainInitialization
>;
