import { useEffect, useState } from 'react';
import useApiStore from '@/store/api';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';
import { useShallow } from 'zustand/react/shallow';
import { findBestWssEndpoint } from '@/utils/rpc-endpoint';

interface UseApiConnectionProps {
  fromChain?: ChainInfoWithXcAssetsData;
  toChain?: ChainInfoWithXcAssetsData;
}

export function useApiConnection({
  fromChain,
  toChain
}: UseApiConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const {
    fromChainApi,
    connectFromChainApi,
    disconnectFromChainApi,
    toChainApi,
    connectToChainApi,
    disconnectToChainApi
  } = useApiStore(
    useShallow((state) => ({
      fromChainApi: state.fromChainApi,
      connectFromChainApi: state.connectFromChainApi,
      disconnectFromChainApi: state.disconnectFromChainApi,
      toChainApi: state.toChainApi,
      connectToChainApi: state.connectToChainApi,
      disconnectToChainApi: state.disconnectToChainApi
    }))
  );

  useEffect(() => {
    const initFromChainApi = async () => {
      disconnectFromChainApi();
      setIsConnecting(true);
      if (!fromChain?.providers) return;
      const bestEndpoint = await findBestWssEndpoint(fromChain.providers);
      if (bestEndpoint) connectFromChainApi(bestEndpoint);
      setIsConnecting(false);
    };
    initFromChainApi();
  }, [fromChain, connectFromChainApi, disconnectFromChainApi]);

  useEffect(() => {
    const initToChainApi = async () => {
      disconnectToChainApi();
      setIsConnecting(true);
      if (!toChain?.providers) return;
      const bestEndpoint = await findBestWssEndpoint(toChain.providers);
      if (bestEndpoint) connectToChainApi(bestEndpoint);
      setIsConnecting(false);
    };
    initToChainApi();
  }, [toChain, connectToChainApi, disconnectToChainApi]);

  useEffect(() => {
    return () => {
      useApiStore.getState().disconnectAll();
    };
  }, []);
  return {
    fromChainApi,
    toChainApi,
    isConnecting
  };
}
