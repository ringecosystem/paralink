import { useEffect, useState } from 'react';
import { getXcmWeightFee } from '@/services/xcm/xcm-weight';
import { BN, BN_ZERO } from '@polkadot/util';
import useApiConnectionsStore from '@/store/api-connections';
import type { Asset } from '@/types/registry';

interface UseCrossFeeProps {
  asset?: Asset;
  recipientAddress?: string;
  paraId?: number;
}
export const useCrossFee = ({
  asset,
  recipientAddress,
  paraId
}: UseCrossFeeProps) => {
  const [fee, setFee] = useState<BN>(BN_ZERO);
  const [isLoading, setIsLoading] = useState(false);

  const getValidApi = useApiConnectionsStore((state) => state.getValidApi);

  useEffect(() => {
    const fetchFee = async () => {
      if (!getValidApi || !asset || !recipientAddress || !paraId) return;
      setIsLoading(true);
      const api = await getValidApi(paraId);
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
  }, [getValidApi, asset, recipientAddress, paraId]);

  return {
    fee,
    isLoading
  };
};
