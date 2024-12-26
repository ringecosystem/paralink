import { useMemo, useState } from 'react';
import { queryDeliveryFees } from '@/services/xcm/deliver-fee';
import { BN, BN_ZERO, bnToBn } from '@polkadot/util';
import useApiConnectionsStore from '@/store/api-connections';
import type { Asset } from '@/types/xcm-asset';
import { isNil } from 'lodash-es';
import { useDebounceEffect } from '@/hooks/use-debounce-effect';

interface UseNetworkFeeProps {
  sourceChainId?: number;
  asset?: Asset;
  targetChainId?: number;
  recipientAddress?: string;
  partialFee?: BN;
}

export function useNetworkFee({
  sourceChainId,
  asset,
  targetChainId,
  recipientAddress,
  partialFee
}: UseNetworkFeeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<BN>(BN_ZERO);
  const getValidApi = useApiConnectionsStore((state) => state.getValidApi);

  useDebounceEffect(() => {
    const fetchDeliveryFee = async () => {
      try {
        if (
          isNil(sourceChainId) ||
          isNil(targetChainId) ||
          !asset ||
          !recipientAddress
        )
          return;
        setIsLoading(true);
        const api = await getValidApi(sourceChainId);
        const fee = await queryDeliveryFees({
          api,
          asset,
          recipientAddress,
          sourceChainId,
          targetChainId
        });
        setDeliveryFee(fee ? fee : BN_ZERO);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeliveryFee();
    return () => {
      setDeliveryFee(BN_ZERO);
      setIsLoading(false);
    };
  }, [getValidApi, asset, recipientAddress, sourceChainId, targetChainId]);

  const networkFee = useMemo(() => {
    const deliveryFeeBN = bnToBn(deliveryFee);
    const totalFee = partialFee ? partialFee.add(deliveryFeeBN) : deliveryFeeBN;
    return totalFee;
  }, [partialFee, deliveryFee]);

  return {
    isLoading,
    networkFee
  };
}
