'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AddressInput } from '@/components/address-input';
import Alert from '@/components/alert';
import { FeeBreakdown } from '@/components/fee-breakdown';
import { TokenSelect } from '@/components/token-select';
import { ConnectOrActionButton } from '@/components/connect-or-action-button';
import useChainsStore from '@/store/chains';
import useTokensStore from '@/store/tokens';
// import { getAcceptablePaymentAsset } from '@/services/xcm/polkadot-xcm';

import { useChainInitialization } from '../_hooks/use-chain-initlization';
import { useCrossChainSetup } from '../_hooks/use-cross-chain-setup';
import { ChainSwitcher } from './chain-switcher';
import type { ChainConfig } from '@/types/asset-registry';
import type { ChainInfo } from '@/types/chains-info';
import type { Asset } from '@/types/assets-info';
import Loading from './loading';

import {
  createXcmTransfer,
  createXcmTransferExtrinsic,
  signAndSendExtrinsic
} from '@/services/xcm/polkadot-xcm';
import { useWalletStore } from '@/store/wallet';
import { useTokensFetchBalance } from '../_hooks/use-tokens-fetch-balance';
import { useExistentialDeposit } from '@/services/xcm/existential-deposit';
import useApiStore from '@/store/api';
import { AnimatedErrorMessage } from '@/components/animated-error-message';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { useTransactionDetailStore } from '@/store/transaction-detail';
import { formatBridgeTransactionTimestamp } from '@/utils/date';
import { useXcmExtrinsic } from '../_hooks/use-xcm-extrinsic';
import { formatUnits } from 'viem';

interface DashboardProps {
  polkadotAssetRegistry: ChainConfig;
  chainsInfo: ChainInfo[];
  assetsInfo: Asset[];
}
export default function Dashboard({
  polkadotAssetRegistry,
  chainsInfo,
  assetsInfo
}: DashboardProps) {
  const [amount, setAmount] = useState<string>('');
  const [isLoadingCrossChain, setIsLoadingCrossChain] = useState(false);
  const { selectedWallet, selectedAccount } = useWalletStore();
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  // 12pxLnQcjJqjG4mDaeJoKBLMfsdHZ2p2RxKHNEvicnZwZobx
  const { address } = useWalletConnection();
  const openTransactionDetail = useTransactionDetailStore(
    (state) => state.open
  );

  const {
    chains,
    fromChainId,
    fromChains,
    fromChain,
    toChainId,
    toChain,
    toChains
  } = useChainsStore(
    useShallow((state) => ({
      chains: state.chains,
      setChains: state.setChains,
      fromChainId: state.fromChainId,
      toChainId: state.toChainId,
      fromChains: state.fromChains,
      toChains: state.toChains,
      fromChain: state.getFromChain(),
      toChain: state.getToChain()
    }))
  );

  // init chains and setup cross chain config
  const { isLoading } = useChainInitialization({
    polkadotAssetRegistry,
    chainsInfo,
    assetsInfo
  });

  const { setupCrossChainConfig, swapChains, updateToChain } =
    useCrossChainSetup(assetsInfo);

  const {
    tokens,
    selectedToken,
    setSelectedToken,
    selectedTokenBalance,
    tokensBalance
  } = useTokensStore(
    useShallow((state) => ({
      tokens: state.tokens,
      selectedToken: state.selectedToken,
      selectedTokenBalance: state.selectedTokenBalance,
      tokensBalance: state.tokenBalance,
      setSelectedToken: state.setSelectedToken,
      setTokensBalance: state.setTokensBalance
    }))
  );

  // init from chain api
  const { fromChainApi, toChainApi } = useApiStore(
    useShallow((state) => ({
      fromChainApi: state.fromChainApi,
      toChainApi: state.toChainApi
    }))
  );

  const { isLoading: isTokensLoading } = useTokensFetchBalance({
    fromChain,
    fromChainApi,
    address
  });

  const { extrinsic, partialFee } = useXcmExtrinsic({
    fromChainApi,
    selectedToken,
    toChain,
    recipientAddress,
    amount,
    address
  });

  const networkFee = useMemo(() => {
    if (!tokens?.length) return false;
    const nativeToken = tokens.find(
      (token) =>
        token.symbol?.toLowerCase() ===
        fromChain?.nativeToken?.symbol?.toLowerCase()
    );
    if (!nativeToken || !partialFee || !nativeToken.decimals) return false;
    const fee = formatUnits(BigInt(partialFee), nativeToken.decimals);
    return {
      fee,
      icon: nativeToken.icon,
      symbol: nativeToken.symbol
    };
  }, [partialFee, fromChain, tokens]);

  const { isInsufficientBalance } = useMemo(() => {
    if (!address || !amount) {
      return {
        isInsufficientBalance: false
      };
    }

    const balance = selectedTokenBalance?.balance;
    const isInsufficientBalance =
      Number(amount) > Number(balance?.toString() || '0');

    return {
      isInsufficientBalance
    };
  }, [amount, selectedTokenBalance?.balance, address]);

  const handleChangeFromChainId = useCallback(
    async (id: string) => {
      setIsLoadingCrossChain(true);
      await setupCrossChainConfig(chains, id);
      setIsLoadingCrossChain(false);
    },
    [chains, setupCrossChainConfig]
  );

  const handleChangeToChainId = useCallback(
    async (id: string) => {
      setIsLoadingCrossChain(true);
      await updateToChain({ chains, toChainId: id });
      setIsLoadingCrossChain(false);
    },
    [chains, updateToChain]
  );

  const {
    isLoading: isExistentialDepositLoading,
    formattedDeposit,
    hasEnoughBalance
  } = useExistentialDeposit({ api: toChainApi, address: recipientAddress });

  const handleSwitch = useCallback(() => {
    if (!chains?.length || !fromChainId || !toChainId) return;
    setSelectedToken(undefined);
    setAmount('');
    swapChains({
      chains,
      fromChainId,
      toChainId
    });
  }, [setSelectedToken, swapChains, chains, fromChainId, toChainId]);

  const handleOpenTransactionDetail = useCallback(() => {
    const timestamp = formatBridgeTransactionTimestamp();
    if (fromChain && toChain && address && recipientAddress) {
      openTransactionDetail({
        timestamp,
        amount: `${amount} ${selectedToken?.symbol}`,
        fromAddress: address,
        toAddress: recipientAddress,
        fromChain,
        toChain,
        fromTxHash: '0x092...bb41',
        toTxHash: '0x092...bb41'
      });
    }
  }, [
    amount,
    address,
    recipientAddress,
    fromChain,
    toChain,
    selectedToken,
    openTransactionDetail
  ]);

  const handleClick = useCallback(async () => {
    // if (!fromChainId || !toChainId) return;
    // if (!fromChainApi || !selectedToken?.xcAssetData || !toChain) return;
    // const { original, acceptableToken } = await checkAcceptablePaymentToken({
    //   api: fromChainApi,
    //   token: selectedToken.xcAssetData
    // });
    // console.log('original', original);
    // removeCommasAndConvertToNumber
    // const { weight, xcmMessage } = await calculateExecutionWeight({
    //   api: toChainApi,
    //   token: selectedToken.xcAssetData,
    //   amount,
    //   toChain,
    //   recipientAddress
    // });
    // console.log(
    //   ' fromChainApi.call.xcmPaymentApi.queryDeliveryFees',
    //   fromChainApi.call.xcmPaymentApi.queryDeliveryFees
    // );
    // console.log('weight', weight, weight?.toHuman());
    // const weightJson = weight.toHuman()?.Ok;
    // console.log('weightJson', weightJson);
    // const refTime = removeCommasAndConvertToNumber(weightJson?.refTime);
    // const proofSize = removeCommasAndConvertToNumber(weightJson?.proofSize);
    // console.log('refTime', refTime, 'proofSize', proofSize);
    // const fee = await queryWeightToAssetFee({
    //   api: toChainApi,
    //   weight: {
    //     refTime,
    //     proofSize
    //   },
    //   asset: {
    //     V3: {
    //       Concrete: {
    //         parents: 0,
    //         interior: {
    //           // X1: {
    //           //   Parachain: toChain.id
    //           // }
    //           X3: [
    //             { Parachain: toChain.id },
    //             { PalletInstance: 50 },
    //             { GeneralIndex: 1984 }
    //           ]
    //         }
    //       }
    //     }
    //   }
    // })?.catch((error) => {
    //   console.log('queryWeightToAssetFee error', error);
    // });
    // // 2. 计算传输费用
    // console.log(
    //   'fromChainApi.call.xcmPaymentApi',
    //   fromChainApi.call.xcmPaymentApi
    // );
    // const deliveryFee = await fromChainApi.call.xcmPaymentApi.queryDeliveryFees(
    //   {
    //     V2: {
    //       parents: 0,
    //       interior: {
    //         X3: [
    //           { Parachain: toChain.id },
    //           { PalletInstance: 50 },
    //           { GeneralIndex: 1984 }
    //         ]
    //       }
    //     }
    //   }, // 目标链的位置
    //   xcmMessage
    // );
    // console.log('fee', fee?.toHuman());
    // console.log('weight', weight);
    // console.log('fromChainApi', fromChainApi);
    // const crossTokenLocation = await getAcceptablePaymentAsset(fromChainApi);
    // console.log('crossTokenLocation', crossTokenLocation);
    // console.log('amount', amount);
    // const { dest, beneficiary, assets, feeAssetItem, weightLimit } =
    //   createXcmTransfer({
    //     token: selectedToken.xcAssetData,
    //     amount,
    //     toChain,
    //     // crossAmount: removeCommasAndConvertToNumber(fee?.toHuman()?.Ok),
    //     crossAmount: '464',
    //     recipientAddress
    //   });
    // const extrinsic =
    //   await fromChainApi.tx.polkadotXcm.limitedReserveTransferAssets(
    //     dest,
    //     beneficiary,
    //     assets,
    //     feeAssetItem,
    //     weightLimit
    //   );
    // signAndSendExtrinsic(
    //   extrinsic,
    //   selectedWallet?.signer,
    //   selectedAccount?.address ?? ''
    // );
    // handleOpenTransactionDetail();
    // extrinsic
    if (!extrinsic || !address || !selectedWallet?.signer) return;
    signAndSendExtrinsic(extrinsic, selectedWallet?.signer, address);
  }, [
    amount,
    fromChainApi,
    selectedWallet,
    selectedAccount,
    fromChain,
    toChain,
    fromChainId,
    toChainId,
    recipientAddress,
    selectedToken?.xcAssetData,
    toChain,
    handleOpenTransactionDetail,
    extrinsic
  ]);

  const buttonLoadingText = useMemo(() => {
    if (isLoadingCrossChain || isExistentialDepositLoading)
      return 'Connecting...';
    return undefined;
  }, [isLoadingCrossChain, isExistentialDepositLoading]);

  useEffect(() => {
    setRecipientAddress('');
  }, [toChainId]);

  return (
    <>
      <div className="container absolute left-0 right-0 top-[calc(var(--header-height)+10px)]">
        <Alert
          message={
            <p className="space-x-[10px]">
              <strong>Bridge Tokens with Paralink!</strong>
              <span>
                Paralink makes it easy to take your tokens interchain. Issues?
              </span>
              <a
                className="font-bold"
                href="https://github.com/ringecosystem/paralink/issues/new/choose"
                target="_blank"
                rel="noopener noreferrer"
              >
                Report here↗
              </a>
            </p>
          }
          closable={true}
        />
      </div>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="container flex flex-col gap-[30px] pt-[min(120px,15vh)] md:pt-[min(100px,12vh)]">
          <div className="mx-auto flex w-full flex-col gap-[20px] rounded-[var(--radius)] bg-white p-[15px] shadow-sm md:w-[460px] md:rounded-[var(--radius-lg)] md:p-[20px]">
            <ChainSwitcher
              fromChainId={fromChainId}
              fromChain={fromChain}
              toChainId={toChainId}
              toChain={toChain}
              fromParachains={fromChains}
              toParachains={toChains}
              onChangeFromChain={handleChangeFromChainId}
              onChangeToChain={handleChangeToChainId}
              onSwitch={handleSwitch}
            />

            <TokenSelect
              token={selectedToken}
              tokenBalance={selectedTokenBalance}
              tokensBalance={tokensBalance}
              onChangeToken={setSelectedToken}
              onChangeAmount={setAmount}
              tokens={tokens}
              isLoading={isTokensLoading}
              error={
                <>
                  <AnimatedErrorMessage
                    show={isInsufficientBalance}
                    message="Insufficient balance."
                  />
                </>
              }
            />

            <AddressInput
              value={recipientAddress}
              chain={toChain}
              onChange={setRecipientAddress}
              error={
                <AnimatedErrorMessage
                  show={!hasEnoughBalance && !isExistentialDepositLoading}
                  message={`You need at least ${formattedDeposit} in your recipient account on ${toChain?.name} to keep the account alive.`}
                />
              }
            />

            <FeeBreakdown
              amount={100}
              networkFee={networkFee}
              crossChainFee={0.02}
              finalAmount={99.97}
            />
            <div className="h-[1px] w-full bg-[#F2F3F5]"></div>

            <ConnectOrActionButton
              onAction={handleClick}
              isLoading={isLoadingCrossChain || isExistentialDepositLoading}
              loadingText={buttonLoadingText}
              isDisabled={!hasEnoughBalance || amount === '' || amount === '0'}
            >
              Confirm Transaction
            </ConnectOrActionButton>
          </div>
        </div>
      )}
    </>
  );
}
