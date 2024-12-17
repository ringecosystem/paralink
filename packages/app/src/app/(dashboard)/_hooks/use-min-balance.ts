import { useEffect, useMemo, useState } from 'react';
import { BN, BN_ZERO } from '@polkadot/util';
import { getTargetMinBalance } from '@/services/xcm/target-min-balance';
import useApiConnectionsStore from '@/store/api-connections';
import { normalizeInterior } from '@/utils/xcm/helper';
import type { Asset } from '@/types/xcm-asset';

interface UseMinBalanceProps {
  chainId?: number;
  asset?: Asset;
  decimals?: number | null;
}
export const useMinBalance = ({
  chainId,
  asset,
  decimals
}: UseMinBalanceProps) => {
  const [formatted, setFormatted] = useState<string>('0');
  const [balance, setBalance] = useState<BN>(BN_ZERO);
  const [isLoading, setIsLoading] = useState(false);
  const getValidApi = useApiConnectionsStore((state) => state.getValidApi);
  const assetId = useMemo(() => {
    if (!asset) return null;
    const interior = normalizeInterior(asset.xcmLocation?.v1?.interior);
    if (interior) {
      if (Array.isArray(interior)) {
        return interior?.find((item) => item.generalIndex)?.generalIndex;
      }
    }
    return null;
  }, [asset]);

  useEffect(() => {
    const fetchMinBalance = async () => {
      if (!chainId || !assetId || !decimals) return;
      setIsLoading(true);

      const api = await getValidApi(chainId);
      const { balance, formatted } = await getTargetMinBalance({
        api,
        assetId,
        decimals
      });

      setFormatted(formatted);
      setBalance(balance);
      setIsLoading(false);
    };
    fetchMinBalance();
    return () => {
      setFormatted('0');
      setBalance(BN_ZERO);
      setIsLoading(false);
    };
  }, [getValidApi, chainId, assetId, decimals]);
  return {
    formatted,
    balance,
    isLoading
  };
};
