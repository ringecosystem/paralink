import { useState } from 'react';
import { BN, BN_ZERO, bnToBn } from '@polkadot/util';
import { isNil } from 'lodash-es';
import { getMinBalance } from '@/services/xcm/get-min-balance';
import useApiConnectionsStore from '@/store/api-connections';
import useChainsStore from '@/store/chains';
import { adjustFee } from '@/config/feeAdjustments';
import { useDebounceEffect } from '@/hooks/use-debounce-effect';
import type { Asset } from '@/types/xcm-asset';
interface UseSourceChainMinBalanceProps {
  chainId?: number;
  asset?: Asset;
  decimals?: number | null;
}
export const useSourceChainMinBalance = ({
  asset,
  decimals
}: UseSourceChainMinBalanceProps) => {
  const [balance, setBalance] = useState<BN>(BN_ZERO);
  const [isLoading, setIsLoading] = useState(false);
  const getValidApi = useApiConnectionsStore((state) => state.getValidApi);

  const sourceChainId = useChainsStore((state) => state.sourceChainId);

  useDebounceEffect(() => {
    if (!asset || asset.isNative) {
      setBalance(BN_ZERO);
      setIsLoading(false);
      return;
    }

    // Handle asset.minAmount if it exists
    if (asset.minAmount && typeof asset.minAmount === 'string') {
      try {
        const minBalance = bnToBn(asset.minAmount);
        setBalance(minBalance);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error('Failed to parse minAmount:', error);
        // Continue with normal flow if parsing fails
      }
    }

    const assetId = asset?.assetId;
    const fetchMinBalance = async () => {
      if (isNil(sourceChainId) || isNil(assetId) || isNil(decimals)) return;
      setIsLoading(true);
      const api = await getValidApi(sourceChainId);
      const { balance } = await getMinBalance({
        api,
        assetId,
        decimals
      });

      setBalance(balance);
      setIsLoading(false);
    };
    fetchMinBalance();

    return () => {
      setBalance(BN_ZERO);
      setIsLoading(false);
    };
  }, [getValidApi, sourceChainId, asset, decimals]);

  return {
    balance: adjustFee(balance, 'minBalance'),
    isLoading
  };
};
