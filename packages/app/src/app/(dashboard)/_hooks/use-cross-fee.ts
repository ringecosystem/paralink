import { useEffect, useState } from 'react';
import { getXcmWeightFee } from '@/services/xcm/xcm-weight';
import { BN, BN_ZERO } from '@polkadot/util';
import useApiConnectionsStore from '@/store/api-connections';
import type { Asset } from '@/types/xcm-asset';
import { isNil } from 'lodash-es';
import { useDebounceEffect } from '@/hooks/use-debounce-effect';

interface UseCrossFeeProps {
  asset?: Asset;
  recipientAddress?: string;
  targetChainId?: number;
  sourceChainId?: number;
}
export const useCrossFee = ({
  asset,
  recipientAddress,
  targetChainId,
  sourceChainId
}: UseCrossFeeProps) => {
  const [fee, setFee] = useState<BN>(BN_ZERO);
  const [isLoading, setIsLoading] = useState(false);

  const getValidApi = useApiConnectionsStore((state) => state.getValidApi);

  useDebounceEffect(() => {
    const fetchFee = async () => {
      if (
        !getValidApi ||
        !asset ||
        !recipientAddress ||
        isNil(targetChainId) ||
        isNil(sourceChainId)
      )
        return;
      setIsLoading(true);
      const api = await getValidApi(targetChainId);
      const { fee } = await getXcmWeightFee({
        api,
        asset,
        recipientAddress,
        sourceChainId,
        targetChainId
      });
      setFee(fee ?? BN_ZERO);
      setIsLoading(false);
    };
    fetchFee();
    return () => {
      setFee(BN_ZERO);
      setIsLoading(false);
    };
  }, [getValidApi, asset, recipientAddress, targetChainId, sourceChainId]);

  return {
    fee,
    isLoading
  };
};
