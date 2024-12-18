import { useEffect, useState } from 'react';
import { createXcmTransferExtrinsic } from '@/services/xcm/polkadot-xcm';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BN, BN_ZERO, bnToBn } from '@polkadot/util';
import useApiConnectionsStore from '@/store/api-connections';
import type { Asset, ChainConfig } from '@/types/xcm-asset';

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

  useEffect(() => {
    const getExtrinsic = async () => {
      if (!sourceChainId || !selectedToken || !targetChain || !recipientAddress)
        return;

      setIsLoading(true);
      try {
        const api = await getValidApi(sourceChainId);

        const result = await createXcmTransferExtrinsic({
          sourceChainId: sourceChainId,
          fromChainApi: api,
          token: selectedToken,
          amount,
          targetChain,
          recipientAddress
        });
        setExtrinsic(result);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    getExtrinsic();
    return () => setExtrinsic(undefined);
  }, [
    sourceChainId,
    selectedToken,
    targetChain,
    recipientAddress,
    amount,
    getValidApi
  ]);

  useEffect(() => {
    if (!extrinsic || !address) return;

    const getPaymentInfo = async () => {
      setIsLoading(true);
      try {
        const paymentInfo = await extrinsic.paymentInfo(address);

        const fee = paymentInfo?.toJSON()?.partialFee as number;
        if (fee) setPartialFee(bnToBn(fee));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    getPaymentInfo();
    return () => setPartialFee(BN_ZERO);
  }, [extrinsic, address]);

  return {
    extrinsic,
    partialFee,
    isLoading
  };
}
