import { useEffect, useMemo, useState } from 'react';
import { queryDeliveryFees } from '@/services/xcm/deliver-fee';
import { BN, BN_ZERO, bnToBn } from '@polkadot/util';
import type { ApiPromise } from '@polkadot/api';
import type { XcAssetData } from '@/types/asset-registry';

interface UseNetworkFeeProps {
  fromChainApi: ApiPromise | null;
  asset?: XcAssetData;
  toChainId?: string;
  recipientAddress?: string;
  partialFee?: BN;
}

export function useNetworkFee({
  fromChainApi,
  asset,
  toChainId,
  recipientAddress,
  partialFee
}: UseNetworkFeeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<BN>(BN_ZERO);

  useEffect(() => {
    const fetchDeliveryFee = async () => {
      try {
        if (!fromChainApi || !asset || !recipientAddress || !toChainId) return;
        setIsLoading(true);
        const fee = await queryDeliveryFees({
          api: fromChainApi,
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
  }, [fromChainApi, asset, recipientAddress, toChainId]);

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
