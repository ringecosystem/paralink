import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useChainsStore from '@/store/chains';
import { getFromChains, getToChains } from '@/utils/xcm-chain-registry';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';
import { ApiPromise } from '@polkadot/api';
import useApiConnectionsStore from '@/store/api-connections';
import { findBestWssEndpoint } from '@/utils/rpc-endpoint';

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
  const { setFromChainId, setToChainId, setFromChains, setToChains } =
    useChainsStore(
      useShallow((state) => ({
        setChains: state.setChains,
        setFromChainId: state.setFromChainId,
        setToChainId: state.setToChainId,
        setFromChains: state.setFromChains,
        setToChains: state.setToChains
      }))
    );

  const { connectApi } = useApiConnectionsStore(
    useShallow((state) => ({
      connectApi: state.connectApi,
      disconnectApi: state.disconnectApi
    }))
  );

  const setupChainConnections = useCallback(
    async ({
      chains,
      fromChainId,
      toChainId
    }: {
      chains: ChainInfoWithXcAssetsData[];
      fromChainId: string;
      toChainId: string;
    }) => {
      const fromChain = chains?.find((chain) => chain.id === fromChainId);
      const toChain = chains?.find((chain) => chain.id === toChainId);

      if (!fromChain || !toChain) return;

      const connectionPromises: Promise<ApiPromise | null>[] = [];

      if (fromChain?.providers) {
        const provider = await findBestWssEndpoint(fromChain?.providers);

        if (provider) {
          connectionPromises.push(connectApi(fromChainId, provider));
        }
      }

      if (toChain?.providers) {
        const provider = await findBestWssEndpoint(toChain?.providers);

        if (provider) {
          connectionPromises.push(connectApi(toChainId, provider));
        }
      }

      await Promise.all(connectionPromises);
    },
    [connectApi]
  );

  const setupCrossChainConfig = useCallback(
    async (chains: ChainInfoWithXcAssetsData[], initialFromId?: string) => {
      try {
        const fromChains = getFromChains(chains);
        const fromChainId = initialFromId ? initialFromId : fromChains?.[0]?.id;

        const toChains = getToChains(chains, fromChainId);
        const toChainId = toChains?.[0]?.id ?? '';

        setFromChainId(fromChainId);
        setFromChains(fromChains);
        setToChainId(toChainId);
        setToChains(toChains);

        await setupChainConnections({ chains, fromChainId, toChainId });
      } catch (error) {
        console.error(error);
      }
    },
    [
      setFromChainId,
      setFromChains,
      setToChainId,
      setToChains,
      setupChainConnections
    ]
  );

  const updateToChain = useCallback(
    async ({
      chains,
      toChainId
    }: {
      chains: ChainInfoWithXcAssetsData[];
      toChainId: string;
    }) => {
      try {
        const fromChainId = useChainsStore.getState().fromChainId;
        setToChainId(toChainId);
        if (fromChainId) {
          await setupChainConnections({
            chains,
            fromChainId,
            toChainId
          });
        }
      } catch (error) {
        console.error(error);
      }
    },
    [setToChainId, setupChainConnections]
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

        await setupChainConnections({
          chains,
          fromChainId: newFromChainId,
          toChainId: newToChainId
        });
      } catch (error) {
        console.error(error);
      }
    },
    [setToChains, setFromChainId, setToChainId, setupChainConnections]
  );

  return {
    setupCrossChainConfig,
    swapChains,
    updateToChain
  };
}
