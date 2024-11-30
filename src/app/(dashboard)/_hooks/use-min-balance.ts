import { useEffect, useMemo, useState } from 'react';
import type { ApiPromise } from '@polkadot/api';
import { XcAssetData } from '@/types/asset-registry';
import { getTargetMinBalance } from '@/services/xcm/target-min-balance';
import { parseAndNormalizeXcm } from '@/utils/xcm-location';
import { BN, BN_ZERO } from '@polkadot/util';

interface UseMinBalanceProps {
  api?: ApiPromise | null;
  asset?: XcAssetData | null;
  decimals?: number | null;
}
export const useMinBalance = ({ api, asset, decimals }: UseMinBalanceProps) => {
  const [formatted, setFormatted] = useState<string>('0');
  const [balance, setBalance] = useState<BN>(BN_ZERO);
  const [isLoading, setIsLoading] = useState(false);

  const assetId = useMemo(() => {
    if (!asset) return null;
    const location = parseAndNormalizeXcm(JSON.parse(asset.xcmV1MultiLocation));
    if (location) {
      const { interior } = location;
      let assetId;
      if (Array.isArray(interior)) {
        assetId = interior?.find((item) => item.GeneralIndex)?.GeneralIndex;
      } else {
        assetId = interior?.GeneralIndex;
      }
      return assetId;
    }
    return null;
  }, [asset]);

  useEffect(() => {
    const fetchMinBalance = async () => {
      if (!api || !assetId || !decimals) return;
      setIsLoading(true);
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
  }, [api, assetId, decimals]);
  return {
    formatted,
    balance,
    isLoading
  };
};
