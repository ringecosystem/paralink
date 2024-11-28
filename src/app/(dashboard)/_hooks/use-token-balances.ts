import { useQuery } from '@tanstack/react-query';
import { getAssetBalance } from '@/lib/chain/balance';
import type { AvailableTokens } from '@/utils/xcm-token';
import type { ApiPromise } from '@polkadot/api';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';

interface UseTokenBalancesProps {
  address?: string;
  tokens?: AvailableTokens[];
  fromChain?: ChainInfoWithXcAssetsData;
  fromChainApi?: ApiPromise | null;
}

export function useTokenBalances({
  address,
  tokens,
  fromChain,
  fromChainApi
}: UseTokenBalancesProps) {
  return useQuery({
    queryKey: [
      'token-balances',
      address,
      tokens?.map((t) => t.symbol),
      fromChain?.substrateInfo?.paraId,
      fromChainApi?.genesisHash?.toString(),
      fromChainApi?.isConnected
    ],
    queryFn: async ({ signal }) => {
      if (!address || !fromChainApi || !fromChain?.substrateInfo?.paraId)
        throw new Error('Missing required parameters');

      const balances = await Promise.all(
        tokens?.map((token) =>
          getAssetBalance({
            api: fromChainApi,
            paraId: fromChain?.substrateInfo?.paraId as number,
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
    enabled:
      !!address &&
      !!tokens?.length &&
      !!fromChainApi &&
      !!fromChain?.substrateInfo?.paraId
  });
}
