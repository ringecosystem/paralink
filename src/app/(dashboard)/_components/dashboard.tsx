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

import { useChainInitialization } from '../_hooks/use-chain-initlization';
import { useCrossChainSetup } from '../_hooks/use-cross-chain-setup';
import { ChainSwitcher } from './chain-switcher';
import type { ChainConfig } from '@/types/asset-registry';
import type { ChainInfo } from '@/types/chains-info';
import type { Asset } from '@/types/assets-info';
import Loading from './loading';

import { useExistentialDeposit } from '../_hooks/use-existential-deposit';
import useApiStore from '@/store/api';
import { AnimatedErrorMessage } from '@/components/animated-error-message';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { useXcmExtrinsic } from '../_hooks/use-xcm-extrinsic';

import { useNetworkFee } from '../_hooks/use-network-fee';
import { useCrossFee } from '../_hooks/use-cross-fee';
import { BN_ZERO, bnMax, bnToBn } from '@polkadot/util';
import { useMinBalance } from '../_hooks/use-min-balance';
import { formatTokenBalance, parseUnits } from '@/utils/format';
import { useTransactionExecution } from '@/hooks/use-transaction-execution';
import toast from 'react-hot-toast';
import { getAvailableTokens } from '@/utils/xcm-token';
import { useTokenBalances } from '../_hooks/use-token-balances';

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
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  // 12pxLnQcjJqjG4mDaeJoKBLMfsdHZ2p2RxKHNEvicnZwZobx
  const { address } = useWalletConnection();

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

  const { tokens, selectedToken, setSelectedToken, setTokens } = useTokensStore(
    useShallow((state) => ({
      tokens: state.tokens,
      selectedToken: state.selectedToken,
      setSelectedToken: state.setSelectedToken,
      setTokens: state.setTokens
    }))
  );

  const { fromChainApi, toChainApi } = useApiStore(
    useShallow((state) => ({
      fromChainApi: state.fromChainApi,
      toChainApi: state.toChainApi
    }))
  );

  // 初始化
  const { isLoading } = useChainInitialization({
    polkadotAssetRegistry,
    chainsInfo,
    assetsInfo
  });

  // 设置跨链配置
  const { setupCrossChainConfig, swapChains, updateToChain } =
    useCrossChainSetup();

  // 设置 tokens
  useEffect(() => {
    if (!fromChain || !toChain || !assetsInfo.length) return;
    const tokens = getAvailableTokens({
      fromChain,
      toChain,
      assets: assetsInfo
    });
    if (tokens.length) {
      setTokens(tokens);
      setSelectedToken(tokens[0]);
    }
    return () => {
      setTokens([]);
      setSelectedToken(undefined);
    };
  }, [fromChain, toChain, assetsInfo, setTokens, setSelectedToken]);

  // 获取 token 余额
  const { data: updatedBalances, isLoading: isBalancesLoading } =
    useTokenBalances({
      address,
      tokens,
      fromChain,
      fromChainApi
    });

  // 获取选中的 token 余额
  const selectedTokenBalance = updatedBalances?.find(
    (t) => t.symbol === selectedToken?.symbol
  );

  const {
    extrinsic,
    partialFee,
    isLoading: isExtrinsicLoading
  } = useXcmExtrinsic({
    fromChainApi,
    selectedToken,
    toChain,
    recipientAddress,
    amount,
    address
  });

  const { networkFee, isLoading: isNetworkFeeLoading } = useNetworkFee({
    fromChainApi,
    asset: selectedToken?.xcAssetData,
    toChainId,
    recipientAddress,
    partialFee
  });

  const { fee: crossFee, isLoading: isCrossFeeLoading } = useCrossFee({
    api: toChainApi,
    asset: selectedToken?.xcAssetData,
    recipientAddress,
    paraId: toChain?.id
  });

  const { balance: minBalance, isLoading: isMinBalanceLoading } = useMinBalance(
    {
      api: toChainApi,
      asset: selectedToken?.xcAssetData,
      decimals: selectedToken?.decimals
    }
  );

  const { isLoading: isFromExistentialDepositLoading, deposit: fromDeposit } =
    useExistentialDeposit({ api: fromChainApi, address: address });

  const {
    isLoading: isToExistentialDepositLoading,
    deposit: toDeposit,
    decimals: toDepositDecimals,
    symbol: toDepositSymbol,
    hasEnoughBalance: hasToEnoughBalance
  } = useExistentialDeposit({ api: toChainApi, address: recipientAddress });

  const minBalanceBN = bnToBn(minBalance).add(bnToBn(crossFee));

  const maxBalanceBN = bnMax(
    BN_ZERO,
    selectedTokenBalance?.balance
      ?.sub(bnToBn(fromDeposit))
      ?.sub(networkFee ? bnToBn(networkFee?.fee) : BN_ZERO) ?? BN_ZERO
  );

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

  const handleSwitch = useCallback(async () => {
    if (!chains?.length || !fromChainId || !toChainId) return;
    setIsLoadingCrossChain(true);

    setSelectedToken(undefined);
    setAmount('');
    await swapChains({
      chains,
      fromChainId,
      toChainId
    });
    setIsLoadingCrossChain(false);
  }, [setSelectedToken, swapChains, chains, fromChainId, toChainId]);

  const { executeTransaction } = useTransactionExecution({
    fromChain,
    toChain,
    selectedToken,
    amount,
    recipientAddress
  });

  const handleClick = useCallback(async () => {
    if (!extrinsic || !address) return;
    try {
      await executeTransaction({ extrinsic, address });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Transaction failed'
      );
    }
  }, [extrinsic, address, executeTransaction]);

  const buttonLoadingText = useMemo(() => {
    if (
      isLoadingCrossChain ||
      isToExistentialDepositLoading ||
      isFromExistentialDepositLoading
    )
      return 'Connecting...';
    return undefined;
  }, [
    isLoadingCrossChain,
    isToExistentialDepositLoading,
    isFromExistentialDepositLoading
  ]);

  useEffect(() => {
    setRecipientAddress('');
  }, [toChainId]);

  console.log(
    'amount',
    amount,
    parseUnits({
      value: amount,
      decimals: selectedToken?.decimals ?? 3
    })?.toString()
  );

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
              tokens={tokens}
              tokenBalance={selectedTokenBalance}
              tokenBalances={updatedBalances}
              minBalance={minBalanceBN}
              maxBalance={maxBalanceBN}
              onChangeToken={setSelectedToken}
              onChangeAmount={setAmount}
              isLoading={isBalancesLoading}
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
                  show={!hasToEnoughBalance && !isToExistentialDepositLoading}
                  message={`You need at least ${formatTokenBalance(toDeposit, {
                    decimals: toDepositDecimals,
                    symbol: toDepositSymbol
                  })} in your recipient account on ${toChain?.name} to keep the account alive.`}
                />
              }
            />
            {!!selectedToken?.symbol && selectedToken?.decimals && (
              <FeeBreakdown
                showValue={amount !== '' && !!address}
                amount={parseUnits({
                  value: amount,
                  decimals: selectedToken?.decimals ?? 3
                })}
                networkFee={networkFee}
                crossFee={crossFee}
                nativeTokenInfo={fromChain?.nativeToken}
                loading={
                  isNetworkFeeLoading || isCrossFeeLoading || isExtrinsicLoading
                }
                xcmTokenInfo={{
                  symbol: selectedToken?.symbol,
                  decimals: selectedToken?.decimals,
                  icon: selectedToken?.icon
                }}
              />
            )}
            <div className="h-[1px] w-full bg-[#F2F3F5]"></div>

            <ConnectOrActionButton
              onAction={handleClick}
              isLoading={
                isLoadingCrossChain ||
                isToExistentialDepositLoading ||
                isFromExistentialDepositLoading ||
                isExtrinsicLoading ||
                isNetworkFeeLoading ||
                isCrossFeeLoading ||
                isMinBalanceLoading
              }
              loadingText={buttonLoadingText}
              isDisabled={
                !hasToEnoughBalance ||
                amount === '' ||
                amount === '0' ||
                recipientAddress === ''
              }
            >
              Confirm Transaction
            </ConnectOrActionButton>
          </div>
        </div>
      )}
    </>
  );
}
