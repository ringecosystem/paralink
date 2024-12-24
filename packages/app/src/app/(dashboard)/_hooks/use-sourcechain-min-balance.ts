import { useEffect, useState } from 'react';
import { BN, BN_ZERO } from '@polkadot/util';
import { getMinBalance } from '@/services/xcm/get-min-balance';
import useApiConnectionsStore from '@/store/api-connections';
import useChainsStore from '@/store/chains';
import type { Asset } from '@/types/xcm-asset';
import { isNil } from 'lodash-es';

interface UseSourceChainMinBalanceProps {
  chainId?: number;
  asset?: Asset;
  decimals?: number | null;
}
export const useSourceChainMinBalance = ({
  asset,
  decimals
}: UseSourceChainMinBalanceProps) => {
  const [formatted, setFormatted] = useState<string>('0');
  const [balance, setBalance] = useState<BN>(BN_ZERO);
  const [isLoading, setIsLoading] = useState(false);
  const getValidApi = useApiConnectionsStore((state) => state.getValidApi);

  const sourceChainId = useChainsStore((state) => state.sourceChainId);

  useEffect(() => {
    let isCurrentEffect = true;

    if (!asset || asset?.isNative) {
      setFormatted('0');
      setBalance(BN_ZERO);
      setIsLoading(false);
      return;
    }
    const assetId = asset?.assetId;
    const fetchMinBalance = async () => {
      if (isNil(sourceChainId) || isNil(assetId) || isNil(decimals)) return;
      setIsLoading(true);
      const api = await getValidApi(sourceChainId);
      const { balance, formatted } = await getMinBalance({
        api,
        assetId,
        decimals
      });

      if (isCurrentEffect) {
        setFormatted(formatted);
        setBalance(balance);
        setIsLoading(false);
      }
    };
    fetchMinBalance();

    return () => {
      isCurrentEffect = false;
      setFormatted('0');
      setBalance(BN_ZERO);
      setIsLoading(false);
    };
  }, [getValidApi, sourceChainId, asset, decimals]);

  console.log('asset', asset, formatted);

  return {
    formatted,
    balance,
    isLoading
  };
};
