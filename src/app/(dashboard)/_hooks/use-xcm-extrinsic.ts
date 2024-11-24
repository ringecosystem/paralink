import { useEffect, useState } from 'react';
import { createXcmTransferExtrinsic } from '@/services/xcm/polkadot-xcm';
import type { ApiPromise } from '@polkadot/api';
import { ChainInfoWithXcAssetsData } from '@/store/chains';
import { AvailableTokens } from '@/utils/xcm-token';
import { SubmittableExtrinsic } from '@polkadot/api/types';

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

  const [partialFee, setPartialFee] = useState<string>('');

  useEffect(() => {
    const getExtrinsic = async () => {
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
    };

    getExtrinsic().then((result) => {
      if (result) setExtrinsic(result);
    });
  }, [
    fromChainApi,
    selectedToken?.xcAssetData,
    toChain,
    recipientAddress,
    amount
  ]);

  useEffect(() => {
    console.log('address', address);

    const getPaymentInfo = async () => {
      if (!extrinsic || !address) return;
      const paymentInfo = await extrinsic.paymentInfo(address);
      const fee = paymentInfo?.toHuman()?.partialFee;
      console.log('fee', fee);

      if (fee) {
        const cleanFee = fee.toString().replace(/,/g, '');
        setPartialFee(cleanFee);
      }
    };

    getPaymentInfo();
  }, [extrinsic, address]);

  return {
    extrinsic,
    partialFee
  };
}
