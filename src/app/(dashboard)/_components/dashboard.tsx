'use client';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AddressInput } from '@/components/address-input';
import Alert from '@/components/alert';
import { FeeBreakdown } from '@/components/fee-breakdown';
import { ConnectOrActionButton } from '@/components/connect-or-action-button';
import useChainsStore from '@/store/chains';
import useTokensStore from '@/store/tokens';

import { useChainInitialization } from '../_hooks/use-chain-initlization';
import { useCrossChainSetup } from '../_hooks/use-cross-chain-setup';
import { ChainSwitcher } from './chain-switcher';

import { useExistentialDeposit } from '../_hooks/use-existential-deposit';
import { AnimatedErrorMessage } from '@/components/animated-error-message';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { useXcmExtrinsic } from '../_hooks/use-xcm-extrinsic';

import { useNetworkFee } from '../_hooks/use-network-fee';
import { useCrossFee } from '../_hooks/use-cross-fee';
import { parseUnits } from '@/utils/format';
import { useTransactionExecution } from '@/hooks/use-transaction-execution';
import toast from 'react-hot-toast';
import useApiConnectionsStore from '@/store/api-connections';
import { cn } from '@/lib/utils';
import { AssetPicker } from './asset-picker';
import { BN, BN_ZERO, bnMax } from '@polkadot/util';
import { TransactionManager } from '@/components/transaction-manager';

import type { Asset, ChainRegistry } from '@/types/xcm-asset';
import { getTokenList } from '@/utils/xcm/registry';

interface DashboardProps {
  registryAssets: ChainRegistry;
}

export default function Dashboard({ registryAssets }: DashboardProps) {
  const pickerRef = useRef<{ refreshBalances: () => void }>(null);
  const apiLoadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [tokens, setTokens] = useState<Asset[]>([]);
  const [selectedTokenBalance, setSelectedTokenBalance] = useState<BN>(BN_ZERO);
  const [isLoadingCrossChain, setIsLoadingCrossChain] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const { address } = useWalletConnection();
  const {
    chains,
    sourceChainId,
    sourceChains,
    sourceChain,
    targetChainId,
    targetChain,
    targetChains
  } = useChainsStore(
    useShallow((state) => ({
      chains: state.chains,
      setChains: state.setChains,
      sourceChainId: state.sourceChainId,
      targetChainId: state.targetChainId,
      sourceChains: state.sourceChains,
      targetChains: state.targetChains,
      sourceChain: state.getFromChain(),
      targetChain: state.getToChain()
    }))
  );

  const { sourceLoading, targetLoading } = useApiConnectionsStore(
    useShallow((state) => ({
      sourceLoading: state.loadingStates?.[sourceChainId ?? ''],
      targetLoading: state.loadingStates?.[targetChainId ?? '']
    }))
  );

  const isApiLoading = sourceLoading || targetLoading;

  const selectedToken = useTokensStore((state) => state.selectedToken);

  useChainInitialization({
    registryAssets
  });

  const { setupCrossChainConfig, swapChains, updateToChain } =
    useCrossChainSetup();

  useEffect(() => {
    if (!sourceChain || !targetChain) return;
    const tokens = getTokenList({
      sourceChain,
      targetChain
    });
    if (tokens.length) {
      setTokens(tokens);
    }
    return () => {
      setTokens([]);
    };
  }, [sourceChain, targetChain, setTokens]);


  const {
    extrinsic,
    partialFee,
    isLoading: isExtrinsicLoading
  } = useXcmExtrinsic({
    sourceChainId,
    selectedToken,
    targetChain,
    recipientAddress,
    amount,
    address
  });

  const { networkFee, isLoading: isNetworkFeeLoading } = useNetworkFee({
    sourceChainId,
    asset: selectedToken,
    targetChainId,
    recipientAddress,
    partialFee
  });

  const { fee: crossFee, isLoading: isCrossFeeLoading } = useCrossFee({
    asset: selectedToken,
    recipientAddress,
    paraId: targetChain?.id
  });

  const { isLoading: isFromExistentialDepositLoading, deposit: fromDeposit } =
    useExistentialDeposit({
      chain: sourceChain,
      address: address
    });

  const {
    isLoading: isToExistentialDepositLoading,
    hasEnoughBalance: hasToEnoughBalance,
    formattedDeposit: toDepositFormatted
  } = useExistentialDeposit({
    chain: targetChain,
    address: recipientAddress
  });

  const maxBalanceBN = useMemo(() => {
    if (selectedToken?.isNative) {
      return bnMax(
        BN_ZERO,
        selectedTokenBalance
          ?.sub(fromDeposit)
          ?.sub(networkFee ? networkFee : BN_ZERO) ?? BN_ZERO
      );
    }

    return bnMax(BN_ZERO, selectedTokenBalance ?? BN_ZERO);
  }, [selectedToken, selectedTokenBalance, fromDeposit, networkFee]);

  const { isInsufficientBalance } = useMemo(() => {
    if (address && amount) {
      const balance = selectedTokenBalance;
      const isInsufficientBalance =
        Number(amount) > Number(balance?.toString() || '0');

      return {
        isInsufficientBalance
      };
    }
    return {
      isInsufficientBalance: false
    };
  }, [amount, selectedTokenBalance, address]);

  const handleChangeFromChainId = useCallback(
    async (id: number) => {
      setIsLoadingCrossChain(true);
      await setupCrossChainConfig(chains, id);
      setIsLoadingCrossChain(false);
    },
    [chains, setupCrossChainConfig]
  );

  const handleChangeToChainId = useCallback(
    async (id: number) => {
      setIsLoadingCrossChain(true);
      await updateToChain({ chains, targetChainId: id });
      setIsLoadingCrossChain(false);
    },
    [chains, updateToChain]
  );

  const handleSwitch = useCallback(async () => {
    if (!chains?.length || !sourceChainId || !targetChainId) return;
    setIsLoadingCrossChain(true);
    await swapChains({
      chains,
      sourceChainId,
      targetChainId
    });
    setIsLoadingCrossChain(false);
  }, [swapChains, chains, sourceChainId, targetChainId]);

  const { executeTransaction } = useTransactionExecution({
    sourceChain,
    targetChain,
    selectedToken,
    amount,
    recipientAddress
  });

  const handleClick = useCallback(async () => {
    if (!extrinsic || !address) return;

    try {
      setIsTransactionLoading(true);
      await executeTransaction({ extrinsic, address });
      pickerRef.current?.refreshBalances();
    } catch (error) {
      toast.error((error as unknown as string) ?? 'Transaction failed', {
        position: 'top-center',
        className: 'font-sans text-[14px]'
      });
    } finally {
      setIsTransactionLoading(false);
    }
  }, [extrinsic, address, executeTransaction]);

  const buttonLoadingText = useMemo(() => {
    if (isApiLoading || isLoadingCrossChain || isToExistentialDepositLoading)
      return 'Connecting...';
    return undefined;
  }, [isApiLoading, isLoadingCrossChain, isToExistentialDepositLoading]);

  useEffect(() => {
    setRecipientAddress('');
  }, [targetChainId]);

  useEffect(() => {
    const LOADING_TIMEOUT = 60_000;
    let toastId: string | undefined;

    if (isApiLoading) {
      apiLoadingTimerRef.current = setTimeout(() => {
        toastId = toast.error(
          'Connection is taking longer than expected. This might be due to network issues or slow node response. Please try refreshing the page or try again later.',
          {
            position: 'bottom-right',
            duration: 10_000,
            className: 'font-sans text-[14px]'
          }
        );
      }, LOADING_TIMEOUT);
    } else {
      if (toastId) {
        toast.dismiss(toastId);
      }
      if (apiLoadingTimerRef.current) {
        clearTimeout(apiLoadingTimerRef.current);
        apiLoadingTimerRef.current = null;
      }
    }

    return () => {
      if (apiLoadingTimerRef.current) {
        clearTimeout(apiLoadingTimerRef.current);
        apiLoadingTimerRef.current = null;
      }
      if (toastId) {
        toast.dismiss(toastId);
      }
    };
  }, [isApiLoading]);

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
      <div className="container flex flex-col gap-[30px] pt-[min(120px,15vh)] md:pt-[min(100px,12vh)]">
        <div
          className={cn(
            'mx-auto flex w-full flex-col gap-[20px] rounded-[var(--radius)] bg-white p-[15px] shadow-sm md:w-[460px] md:rounded-[var(--radius-lg)] md:p-[20px]',
            'relative'
          )}
        >
          <ChainSwitcher
            sourceChainId={sourceChainId}
            sourceChain={sourceChain}
            targetChainId={targetChainId}
            targetChain={targetChain}
            fromParachains={sourceChains}
            toParachains={targetChains}
            onChangeFromChain={handleChangeFromChainId}
            onChangeToChain={handleChangeToChainId}
            onSwitch={handleSwitch}
          />
          <div className="relative flex flex-col gap-[20px]">
            <AssetPicker
              ref={pickerRef}
              tokens={tokens}
              crossFee={crossFee}
              isCrossFeeLoading={isCrossFeeLoading}
              maxBalanceBN={maxBalanceBN}
              isMaxBalanceLoading={
                isExtrinsicLoading ||
                isNetworkFeeLoading ||
                isFromExistentialDepositLoading
              }
              onChangeAmount={setAmount}
              onChangeTokenBalance={setSelectedTokenBalance}
              sourceChainId={sourceChainId}
              targetChainId={targetChainId}
              acceptablePaymentTokens={targetChain?.xcmPaymentAcceptTokens}
              onChangeInvalid={setIsInvalid}
              isLoading={isLoadingCrossChain}
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
              chain={targetChain}
              onChange={setRecipientAddress}
              error={
                <AnimatedErrorMessage
                  show={!hasToEnoughBalance && !isToExistentialDepositLoading}
                  message={`You need at least ${toDepositFormatted} in your recipient account on ${targetChain?.name} to keep the account alive.`}
                />
              }
            />
            {
              <FeeBreakdown
                showValue={amount !== '' && !!address}
                amount={parseUnits({
                  value: amount,
                  decimals: selectedToken?.decimals ?? 3
                })}
                networkFee={networkFee}
                crossFee={crossFee}
                nativeTokenInfo={sourceChain?.nativeToken}
                loading={
                  isNetworkFeeLoading || isCrossFeeLoading || isExtrinsicLoading
                }
                xcmTokenInfo={
                  selectedToken?.symbol && selectedToken?.decimals
                    ? {
                      symbol: selectedToken?.symbol,
                      decimals: selectedToken?.decimals,
                      icon: selectedToken?.icon
                    }
                    : undefined
                }
              />
            }
            <div className="h-[1px] w-full bg-[#F2F3F5]"></div>

            <ConnectOrActionButton
              onAction={handleClick}
              isLoading={
                isApiLoading ||
                isLoadingCrossChain ||
                isToExistentialDepositLoading ||
                isNetworkFeeLoading ||
                isCrossFeeLoading ||
                isTransactionLoading ||
                isExtrinsicLoading
              }
              loadingText={buttonLoadingText}
              isDisabled={
                !hasToEnoughBalance ||
                amount === '' ||
                amount === '0' ||
                recipientAddress === '' ||
                isInsufficientBalance
              }
            >
              Confirm Transaction
            </ConnectOrActionButton>
          </div>
        </div>
      </div>
      <TransactionManager />
    </>
  );
}
