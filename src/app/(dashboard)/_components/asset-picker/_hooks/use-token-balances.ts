import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAssetBalance } from '@/lib/chain/balance';
import type { AvailableToken } from '@/utils/xcm-token';
import type { ApiPromise } from '@polkadot/api';

interface UseTokenBalancesProps {
  address?: string;
  tokens?: AvailableToken[];
  paraId?: string;
  api?: ApiPromise | null;
}

export function useTokenBalances({
  address,
  tokens,
  paraId,
  api
}: UseTokenBalancesProps) {
  const queryClient = useQueryClient();
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
