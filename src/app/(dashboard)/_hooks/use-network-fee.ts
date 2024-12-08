import { useEffect, useMemo, useState } from 'react';
import { queryDeliveryFees } from '@/services/xcm/deliver-fee';
import { BN, BN_ZERO, bnToBn } from '@polkadot/util';
import useApiConnectionsStore from '@/store/api-connections';
import type { XcAssetData } from '@/types/asset-registry';

interface UseNetworkFeeProps {
  fromChainId?: string;
  asset?: XcAssetData;
  toChainId?: string;
  recipientAddress?: string;
  partialFee?: BN;
}

export function useNetworkFee({
  fromChainId,
  asset,
  toChainId,
  recipientAddress,
  partialFee
}: UseNetworkFeeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<BN>(BN_ZERO);
  const getValidApi = useApiConnectionsStore((state) => state.getValidApi);

  useEffect(() => {
    const fetchDeliveryFee = async () => {
      try {
        if (!fromChainId || !asset || !recipientAddress || !toChainId) return;
        setIsLoading(true);
        const api = await getValidApi(fromChainId);
        const fee = await queryDeliveryFees({
          api,
          asset,
          recipientAddress,
          toParaId: toChainId
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
  }, [getValidApi, asset, recipientAddress, toChainId]);

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
