import { useState } from 'react';
import { isNil } from 'lodash-es';
import { createXcmTransferExtrinsic } from '@/services/xcm/polkadot-xcm';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BN, BN_ZERO, bnToBn } from '@polkadot/util';
import useApiConnectionsStore from '@/store/api-connections';
import type { Asset, ChainConfig } from '@/types/xcm-asset';
import { useDebounceEffect } from '@/hooks/use-debounce-effect';

interface UseXcmExtrinsicParams {
  sourceChainId?: number;
  selectedToken?: Asset;
  targetChain?: ChainConfig;
  recipientAddress?: string;
  amount: string;
  address?: string;
}

export function useXcmExtrinsic({
  sourceChainId,
  selectedToken,
  targetChain,
  recipientAddress,
  amount,
  address
}: UseXcmExtrinsicParams) {
  const [extrinsic, setExtrinsic] = useState<
    SubmittableExtrinsic<'promise'> | undefined
  >();
  const [partialFee, setPartialFee] = useState<BN>(BN_ZERO);
  const [isLoading, setIsLoading] = useState(false);

  const getValidApi = useApiConnectionsStore((state) => state.getValidApi);

  useDebounceEffect(
    () => {
      const controller = new AbortController();
      let mounted = true;

      const fetchData = async () => {
        setPartialFee(BN_ZERO);
        setExtrinsic(undefined);
        setIsLoading(false);

        if (
          isNil(sourceChainId) ||
          !selectedToken ||
          !targetChain ||
          !recipientAddress
        ) {
          return;
        }

        setIsLoading(true);
        try {
          const api = await getValidApi(sourceChainId);
          if (!mounted) return;

          const result = await createXcmTransferExtrinsic({
            sourceChainId,
            fromChainApi: api,
            token: selectedToken,
            amount,
            targetChain,
            recipientAddress
          });

          if (!mounted) return;
          setExtrinsic(result);

          if (result && address) {
            try {
              const paymentInfo = await result.paymentInfo(address);
              if (!mounted) return;

              const fee = paymentInfo?.toJSON()?.partialFee as number;
              if (fee) {
                setPartialFee(bnToBn(fee));
              }
            } catch (error) {
              console.error('Payment info error:', error);
            }
          }
        } catch (error) {
          console.error('Extrinsic creation error:', error);
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      };

      fetchData();

      return () => {
        mounted = false;
        controller.abort();
        setExtrinsic(undefined);
        setPartialFee(BN_ZERO);
        setIsLoading(false);
      };
    },
    [
      sourceChainId,
      selectedToken,
      targetChain,
      recipientAddress,
      amount,
      address,
      getValidApi
    ],
    { delay: 300 }
  );

  return {
    extrinsic,
    partialFee,
    isLoading
  };
}
