import { calculateExecutionWeight } from '@/services/xcm/xcm-weight';
import { checkAcceptablePaymentToken } from '@/services/xcm/check-acceptable-payment-token';
import { queryWeightToAssetFee } from '@/services/xcm/query-weight-to-asset-fee';
import { removeCommasAndConvertToNumber } from '@/utils/number';

const useXcmCrossFee = () => {
  const calculateExecutionWeightFee = async ({
    api,
    token,
    amount,
    toChain,
    recipientAddress
  }: XcmTransferParams) => {
    const { original, acceptableToken } = await checkAcceptablePaymentToken({
      api: fromChainApi,
      token: selectedToken.xcAssetData
    });
    console.log('original', original);
    removeCommasAndConvertToNumber;

    const { weight, xcmMessage } = await calculateExecutionWeight({
      api: toChainApi,
      token: selectedToken.xcAssetData,
      amount,
      toChain,
      recipientAddress
    });

    console.log(
      ' fromChainApi.call.xcmPaymentApi.queryDeliveryFees',
      fromChainApi.call.xcmPaymentApi.queryDeliveryFees
    );

    console.log('weight', weight, weight?.toHuman());
    const weightJson = weight.toHuman()?.Ok;
    console.log('weightJson', weightJson);
    const refTime = removeCommasAndConvertToNumber(weightJson?.refTime);
    const proofSize = removeCommasAndConvertToNumber(weightJson?.proofSize);
    console.log('refTime', refTime, 'proofSize', proofSize);
    const fee = await queryWeightToAssetFee({
      api: toChainApi,
      weight: {
        refTime,
        proofSize
      },
      asset: {
        V3: {
          Concrete: {
            parents: 0,
            interior: {
              // X1: {
              //   Parachain: toChain.id
              // }
              X3: [
                { Parachain: toChain.id },
                { PalletInstance: 50 },
                { GeneralIndex: 1984 }
              ]
            }
          }
        }
      }
    })?.catch((error) => {
      console.log('queryWeightToAssetFee error', error);
    });

    // 2. 计算传输费用
    console.log(
      'fromChainApi.call.xcmPaymentApi',
      fromChainApi.call.xcmPaymentApi
    );

    const deliveryFee = await fromChainApi.call.xcmPaymentApi.queryDeliveryFees(
      {
        V2: {
          parents: 0,
          interior: {
            X3: [
              { Parachain: toChain.id },
              { PalletInstance: 50 },
              { GeneralIndex: 1984 }
            ]
          }
        }
      }, // 目标链的位置
      xcmMessage
    );
    console.log('fee', fee?.toHuman());
    console.log('weight', weight);
    console.log('fromChainApi', fromChainApi);
    const crossTokenLocation = await getAcceptablePaymentAsset(fromChainApi);
    console.log('crossTokenLocation', crossTokenLocation);
    console.log('amount', amount);
  };
};
