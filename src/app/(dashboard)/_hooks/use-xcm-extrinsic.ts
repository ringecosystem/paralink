import { useEffect, useState } from 'react';
import { createXcmTransferExtrinsic } from '@/services/xcm/polkadot-xcm';
import type { ApiPromise } from '@polkadot/api';
import { ChainInfoWithXcAssetsData } from '@/store/chains';
import { AvailableTokens } from '@/utils/xcm-token';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BN, BN_ZERO } from '@polkadot/util';
import { removeCommasAndConvertToBN } from '@/utils/number';

interface UseXcmExtrinsicParams {
  fromChainApi: ApiPromise | null;
  selectedToken?: AvailableTokens;
  toChain?: ChainInfoWithXcAssetsData;
  recipientAddress?: string;
  amount: string;
  address?: string;
}

export function useXcmExtrinsic({
  fromChainApi,
  selectedToken,
  toChain,
  recipientAddress,
  amount,
  address
}: UseXcmExtrinsicParams) {
  const [extrinsic, setExtrinsic] = useState<
    SubmittableExtrinsic<'promise'> | undefined
  >();
  const [partialFee, setPartialFee] = useState<BN>(BN_ZERO);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getExtrinsic = async () => {
      setIsLoading(true);
      try {
        if (
          !fromChainApi ||
          !selectedToken?.xcAssetData ||
          !toChain ||
          !recipientAddress
        )
          return;

        return createXcmTransferExtrinsic({
          fromChainApi,
          token: selectedToken.xcAssetData,
          amount,
          toChain,
          recipientAddress
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    getExtrinsic().then((result) => {
      if (result) setExtrinsic(result);
    });

    return () => {
      setExtrinsic(undefined);
      setIsLoading(false);
    };
  }, [
    fromChainApi,
    selectedToken?.xcAssetData,
    toChain,
    recipientAddress,
    amount
  ]);

  useEffect(() => {
    setIsLoading(true);
    const getPaymentInfo = async () => {
      try {
        if (!extrinsic || !address) return;
        const paymentInfo = await extrinsic.paymentInfo(address);
        const fee = paymentInfo?.toJSON()?.partialFee;
        if (fee) {
          const cleanFee = removeCommasAndConvertToBN(fee as string);
          setPartialFee(cleanFee);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    getPaymentInfo();
    return () => {
      setPartialFee(BN_ZERO);
      setIsLoading(false);
    };
  }, [extrinsic, address]);

  return {
    extrinsic,
    partialFee,
    isLoading
  };
}
