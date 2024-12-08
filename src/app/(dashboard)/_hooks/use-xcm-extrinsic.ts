import { useEffect, useState } from 'react';
import { createXcmTransferExtrinsic } from '@/services/xcm/polkadot-xcm';
import { ChainInfoWithXcAssetsData } from '@/store/chains';
import type { AvailableToken } from '@/utils/xcm/token';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BN, BN_ZERO, bnToBn } from '@polkadot/util';
import useApiConnectionsStore from '@/store/api-connections';

interface UseXcmExtrinsicParams {
  sourceChainId?: string;
  selectedToken?: AvailableToken;
  targetChain?: ChainInfoWithXcAssetsData;
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
      if (
        !sourceChainId ||
        !selectedToken?.xcAssetData ||
        !targetChain ||
        !recipientAddress
      )
        return;

      setIsLoading(true);
      try {
        const api = await getValidApi(sourceChainId);

        const result = await createXcmTransferExtrinsic({
          sourceChainId: sourceChainId,
          fromChainApi: api,
          token: selectedToken.xcAssetData,
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
    selectedToken?.xcAssetData,
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
