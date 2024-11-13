import { useEffect } from 'react';
import useApiStore from '@/store/api';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';
import { useShallow } from 'zustand/react/shallow';
import { findBestWssEndpoint } from '@/utils/rpc-endpoint';

interface UseApiConnectionProps {
  fromChain?: ChainInfoWithXcAssetsData;
}

export function useApiConnection({ fromChain }: UseApiConnectionProps) {
  const { fromChainApi, connectFromChainApi } = useApiStore(
    useShallow((state) => ({
      fromChainApi: state.fromChainApi,
      connectFromChainApi: state.connectFromChainApi
    }))
  );

  useEffect(() => {
    const initFromChainApi = async () => {
      if (!fromChain?.providers) return;
      const bestEndpoint = await findBestWssEndpoint(fromChain.providers);
      if (bestEndpoint) connectFromChainApi(bestEndpoint);
    };
    initFromChainApi();
  }, [fromChain, connectFromChainApi]);

  useEffect(() => {
    return () => {
      useApiStore.getState().disconnectAll();
    };
  }, []);
  return {
    fromChainApi
  };
}
