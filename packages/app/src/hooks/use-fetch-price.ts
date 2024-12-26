import { useQuery } from '@tanstack/react-query';
import { usePriceStore } from '@/store/price';
import { useShallow } from 'zustand/react/shallow';

const COINMARKETCAP_API_URL = 'https://api.coingecko.com/api/v3/simple/price';

interface CoinGeckoResponse {
  [coinId: string]: {
    usd: number;
  };
}

export function useFetchPrice() {
  const { priceIds, setPrices } = usePriceStore(
    useShallow((state) => ({
      priceIds: state.priceIds,
      setPrices: state.setPrices
    }))
  );
  return useQuery({
    queryKey: ['prices', priceIds],
    queryFn: async () => {
      if (priceIds.length === 0) return {};
      const response = await fetch(
        COINMARKETCAP_API_URL +
          '?ids=' +
          priceIds.join(',') +
          '&vs_currencies=usd',
        {
          headers: {
            x_cg_pro_api_key: process.env.NEXT_PUBLIC_CMC_API_KEY || '',
            Accept: 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch prices: ${response.status} ${response.statusText}`
        );
      }
      const data = (await response.json()) as CoinGeckoResponse;

      // 直接从响应中提取 USD 价格
      const prices: Record<string, number> = {};
      Object.entries(data).forEach(([coinId, priceData]) => {
        prices[coinId.toLowerCase()] = priceData.usd;
      });

      console.log('prices', prices);

      // Update the store
      setPrices(prices);
      return prices;
    },
    enabled: Array.isArray(priceIds) && priceIds.length > 0,
    // Refresh every 60 seconds
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    // Retry 3 times on failure
    retry: 3
    // Keep previous data while fetching
    // keepPreviousData: true，
  });
}
