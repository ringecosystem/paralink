import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useChainsStore from '@/store/chains';
import { getFromChains, getToChains } from '@/utils/xcm-chain-registry';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';
import useTokensStore from '@/store/tokens';
import useApiStore from '@/store/api';
import { findBestWssEndpoint } from '@/utils/rpc-endpoint';
import { getAvailableTokens } from '@/utils/xcm-token';
import { Asset } from '@/types/assets-info';

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
export function useCrossChainSetup(
  assetsInfo: Asset[]
): UseCrossChainSetupReturn {
  const [previousFromEndpoint, setPreviousFromEndpoint] = useState('');
  const [previousToEndpoint, setPreviousToEndpoint] = useState('');

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

  const {
    setTokens,
    setSelectedToken,
    setTokensBalance,
    setSelectedTokenBalance
  } = useTokensStore(
    useShallow((state) => ({
      setTokens: state.setTokens,
      tokens: state.tokens,
      setSelectedToken: state.setSelectedToken,
      selectedToken: state.selectedToken,
      setTokensBalance: state.setTokensBalance,
      setSelectedTokenBalance: state.setSelectedTokenBalance
    }))
  );

  const { connectFromChainApi, connectToChainApi } = useApiStore(
    useShallow((state) => ({
      fromChainApi: state.fromChainApi,
      connectFromChainApi: state.connectFromChainApi,
      disconnectFromChainApi: state.disconnectFromChainApi,
      toChainApi: state.toChainApi,
      connectToChainApi: state.connectToChainApi,
      disconnectToChainApi: state.disconnectToChainApi
    }))
  );

  /**
   * reset state when setup chain connections
   */
  const resetState = useCallback(() => {
    setSelectedTokenBalance(undefined);
    setTokensBalance([]);
  }, [setSelectedTokenBalance, setTokensBalance]);

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

      if (!fromChain || !toChain || !assetsInfo.length) return;

      const connectionPromises: Promise<void>[] = [];

      const tokens = getAvailableTokens({
        fromChain,
        toChain,
        assets: assetsInfo
      });
      if (tokens.length) {
        setTokens(tokens);
        setSelectedToken(tokens[0]);
      }

      if (fromChain?.providers) {
        const fromBestEndpoint = await findBestWssEndpoint(fromChain.providers);
        if (fromBestEndpoint && fromBestEndpoint !== previousFromEndpoint) {
          connectionPromises.push(connectFromChainApi(fromBestEndpoint));
          setPreviousFromEndpoint(fromBestEndpoint);
        }
      }

      if (toChain?.providers) {
        const toBestEndpoint = await findBestWssEndpoint(toChain.providers);
        if (toBestEndpoint && toBestEndpoint !== previousToEndpoint) {
          connectionPromises.push(connectToChainApi(toBestEndpoint));
          setPreviousToEndpoint(toBestEndpoint);
        }
      }

      await Promise.all(connectionPromises);
    },
    [
      connectFromChainApi,
      connectToChainApi,
      setTokens,
      setSelectedToken,
      assetsInfo,
      previousFromEndpoint,
      setPreviousFromEndpoint,
      previousToEndpoint,
      setPreviousToEndpoint
    ]
  );

  const setupCrossChainConfig = useCallback(
    async (chains: ChainInfoWithXcAssetsData[], initialFromId?: string) => {
      try {
        resetState();

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
      resetState,
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
