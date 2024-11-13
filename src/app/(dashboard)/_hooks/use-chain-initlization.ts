import { useCallback, useEffect, useState } from 'react';
import ss58 from '@substrate/ss58-registry';

import { fetchAssetsInfo, fetchChainsInfo } from '@/services/fetch-assets';
import { fetchPolkadotAssetRegistry } from '@/services/fetch-asset-registry';
import { getSupportedParaChains } from '@/lib/registry';
import { useCrossChainSetup } from './use-cross-chain-setup';
import type { Asset } from '@/types/assets-info';

interface ChainInitializationState {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

const initialState: ChainInitializationState = {
  isLoading: true,
  isError: false,
  error: null
};

interface UseChainInitializationReturn extends ChainInitializationState {
  assets: Asset[];
}

export function useChainInitialization(): UseChainInitializationReturn {
  const [state, setState] = useState<ChainInitializationState>(initialState);
  const [assets, setAssets] = useState<Asset[]>([]);

  const { setupCrossChainConfig, setChains } = useCrossChainSetup();

  const initializeChains = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      isError: false,
      error: null
    }));

    try {
      const [polkadotAsset, chainAssets, assetsInfo] = await Promise.all([
        fetchPolkadotAssetRegistry(),
        fetchChainsInfo(),
        fetchAssetsInfo()
      ]);

      const supportedParaChains = await getSupportedParaChains(polkadotAsset);

      const supportedChains = supportedParaChains
        ?.map((chain) => {
          const chainAsset = chainAssets?.find(
            (v) => v.substrateInfo?.paraId?.toString() === chain.id
          );
          const ss58Format = ss58.find(
            (v) => v.prefix === chainAsset?.substrateInfo?.addressPrefix
          );

          return chainAsset
            ? {
                ...chainAsset,
                id: chain?.id?.toString(),
                xcAssetsData: chain?.xcAssetsData,
                isEvmChain:
                  ss58Format?.standardAccount === 'secp256k1' &&
                  !!chainAsset?.evmInfo
              }
            : null;
        })
        ?.filter((v) => !!v);

      // set assets and chains
      setAssets(assetsInfo);
      setChains(supportedChains);

      // setup cross chain config
      setupCrossChainConfig(supportedChains);

      setState({
        isLoading: false,
        isError: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to initialize chains:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isError: true,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to initialize chains')
      }));
    }
  }, [setChains, setupCrossChainConfig]);

  useEffect(() => {
    initializeChains();
  }, [initializeChains]);

  useEffect(() => {
    return () => {
      setState(initialState);
    };
  }, []);

  return {
    ...state,
    assets
  };
}

export type ChainInitializationReturn = ReturnType<
  typeof useChainInitialization
>;
