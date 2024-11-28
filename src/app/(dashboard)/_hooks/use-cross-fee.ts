import { useEffect, useState } from 'react';
import type { ApiPromise } from '@polkadot/api';
import type { XcAssetData } from '@/types/asset-registry';
import { getXcmWeightFee } from '@/services/xcm/xcm-weight';
import { BN, BN_ZERO } from '@polkadot/util';

interface UseCrossFeeProps {
  api: ApiPromise | null;
  asset?: XcAssetData;
  recipientAddress?: string;
  paraId?: string;
}
export const useCrossFee = ({
  api,
  asset,
  recipientAddress,
  paraId
}: UseCrossFeeProps) => {
  const [fee, setFee] = useState<BN>(BN_ZERO);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchFee = async () => {
      if (!api || !asset || !recipientAddress || !paraId) return;
      setIsLoading(true);
      const { fee } = await getXcmWeightFee({
        api,
        asset,
        recipientAddress,
        paraId
      });
      setFee(fee ?? BN_ZERO);
      setIsLoading(false);
    };
    fetchFee();
    return () => {
      setFee(BN_ZERO);
      setIsLoading(false);
    };
  }, [api, asset, recipientAddress, paraId]);

  return {
    fee,
    isLoading
  };
};
