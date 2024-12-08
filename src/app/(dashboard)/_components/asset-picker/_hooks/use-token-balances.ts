import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAssetBalance } from '@/lib/chain/balance';
import type { AvailableToken } from '@/utils/xcm-token';
import { useEffect, useState } from 'react';
import { ApiPromise } from '@polkadot/api';
import useApiConnectionsStore from '@/store/api-connections';

interface UseTokenBalancesProps {
  address?: string;
  tokens?: AvailableToken[];
  paraId?: string;
}

export function useTokenBalances({
  address,
  tokens,
  paraId
}: UseTokenBalancesProps) {
  const queryClient = useQueryClient();
  const [api, setApi] = useState<ApiPromise | null>(null);
  const getValidApi = useApiConnectionsStore((state) => state.getValidApi);

  useEffect(() => {
    const getApi = async () => {
      if (!paraId) return;
      const api = await getValidApi(paraId);
      setApi(api);
    };
    getApi();
    return () => {
      setApi(null);
    };
  }, [getValidApi, paraId]);

  const queryKey = [
    'token-balances',
    address,
    tokens?.map((t) => t.symbol),
    paraId,
    api?.genesisHash?.toString(),
    api?.isConnected
  ];

  const result = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      if (!address || !tokens?.length || !paraId || !api) {
        throw new Error('Missing required parameters');
      }

      const balances = await Promise.all(
        tokens?.map((token) =>
          getAssetBalance({
            api,
            paraId: Number(paraId),
            account: address,
            xcAssetData: token.xcAssetData,
            signal
          })
        ) ?? []
      );

      return tokens?.map((token, index) => ({
        symbol: token.symbol,
        balance: balances[index]
      }));
    },
    enabled: !!address && !!tokens?.length && !!api && !!paraId
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  return {
    ...result,
    refresh
  };
}
