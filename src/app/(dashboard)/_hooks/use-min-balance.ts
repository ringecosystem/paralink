import { useEffect, useMemo, useState } from 'react';
import { BN, BN_ZERO } from '@polkadot/util';
import { getTargetMinBalance } from '@/services/xcm/target-min-balance';
import useApiConnectionsStore from '@/store/api-connections';
import { flattenXcmInterior } from '@/utils/xcm/helper';
import type { XcAssetData } from '@/types/asset-registry';

interface UseMinBalanceProps {
  chainId?: string;
  asset?: XcAssetData | null;
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
    const interior = flattenXcmInterior(asset.xcmV1MultiLocation);
    if (interior) {
      let assetId;
      if (Array.isArray(interior)) {
        assetId = interior?.find((item) => item.generalIndex)?.generalIndex;
      } else {
        assetId = interior?.generalIndex;
      }
      return assetId;
    }
    return null;
  }, [asset]);

  useEffect(() => {
    const fetchMinBalance = async () => {
      if (!chainId || !assetId || !decimals) return;
      setIsLoading(true);
      console.log('fetchMinBalance', chainId, assetId, decimals);

      const api = await getValidApi(chainId);
      const { balance, formatted } = await getTargetMinBalance({
        api,
        assetId,
        decimals
      });
      console.log('fetchMinBalance', formatted);

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
