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
import type { ChainConfig } from '@/types/asset-registry';
import type { ChainInfo } from '@/types/chains-info';
import type { Asset } from '@/types/assets-info';
import Loading from './loading';

import { useExistentialDeposit } from '../_hooks/use-existential-deposit';
import { AnimatedErrorMessage } from '@/components/animated-error-message';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { useXcmExtrinsic } from '../_hooks/use-xcm-extrinsic';

import { useNetworkFee } from '../_hooks/use-network-fee';
import { useCrossFee } from '../_hooks/use-cross-fee';
import { parseUnits } from '@/utils/format';
import { useTransactionExecution } from '@/hooks/use-transaction-execution';
import toast from 'react-hot-toast';
import { toast as toastify } from 'react-toastify';

import { AvailableToken, getAvailableTokens } from '@/utils/xcm-token';
import useApiConnectionsStore from '@/store/api-connections';
import { cn } from '@/lib/utils';
import { AssetPicker } from './asset-picker';
import { BN, BN_ZERO, bnMax } from '@polkadot/util';
import { TransactionManager } from '@/components/transaction-manager';

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
  const pickerRef = useRef<{ refreshBalances: () => void }>(null);

  const [amount, setAmount] = useState<string>('');
  const [tokens, setTokens] = useState<AvailableToken[]>([]);
  const [selectedTokenBalance, setSelectedTokenBalance] = useState<BN>(BN_ZERO);
  const [isLoadingCrossChain, setIsLoadingCrossChain] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
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

  const { isLoading: isApiLoading } = useApiConnectionsStore(
    useShallow((state) => ({
      isLoading: state.isLoading
    }))
  );

  const selectedToken = useTokensStore((state) => state.selectedToken);

  const { isLoading } = useChainInitialization({
    polkadotAssetRegistry,
    chainsInfo,
    assetsInfo
  });

  const { setupCrossChainConfig, swapChains, updateToChain } =
    useCrossChainSetup();

  useEffect(() => {
    if (!fromChain || !toChain || !assetsInfo.length) return;
    const tokens = getAvailableTokens({
      fromChain,
      toChain,
      assets: assetsInfo
    });
    if (tokens.length) {
      setTokens(tokens);
    }
    return () => {
      setTokens([]);
    };
  }, [fromChain, toChain, assetsInfo, setTokens]);

  const {
    extrinsic,
    partialFee,
    isLoading: isExtrinsicLoading
  } = useXcmExtrinsic({
    fromChainId,
    selectedToken,
    toChain,
    recipientAddress,
    amount,
    address
  });

  const { networkFee, isLoading: isNetworkFeeLoading } = useNetworkFee({
    fromChainId,
    asset: selectedToken?.xcAssetData,
    toChainId,
    recipientAddress,
    partialFee
  });

  const { fee: crossFee, isLoading: isCrossFeeLoading } = useCrossFee({
    asset: selectedToken?.xcAssetData,
    recipientAddress,
    paraId: toChain?.id
  });

  const { isLoading: isFromExistentialDepositLoading, deposit: fromDeposit } =
    useExistentialDeposit({
      chainId: fromChainId,
      address: address
    });

  const {
    isLoading: isToExistentialDepositLoading,
    hasEnoughBalance: hasToEnoughBalance,
    formattedDeposit: toDepositFormatted
  } = useExistentialDeposit({
    chainId: toChainId,
    address: recipientAddress
  });

  const maxBalanceBN = bnMax(
    BN_ZERO,
    selectedTokenBalance
      ?.sub(fromDeposit)
      ?.sub(networkFee ? networkFee : BN_ZERO) ?? BN_ZERO
  );

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
    await swapChains({
      chains,
      fromChainId,
      toChainId
    });
    setIsLoadingCrossChain(false);
  }, [swapChains, chains, fromChainId, toChainId]);

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
      setIsTransactionLoading(true);
      await executeTransaction({ extrinsic, address });
      pickerRef.current?.refreshBalances();
    } catch (error) {
      toast.error((error as unknown as string) ?? 'Transaction failed');
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
  }, [toChainId]);

  useEffect(() => {
    const toastId = toastify.loading('Loading...', {
      closeButton: true,
      autoClose: 4000,
      hideProgressBar: false
    });
    setTimeout(() => {
      console.log('toastId', toastId);
      console.log('toastify.isActive(toastId)', toastify.isActive(toastId));

      if (toastId && toastify.isActive(toastId)) {
        toastify.update(toastId, {
          render: 'Success!',
          isLoading: false,
          type: 'error',
          autoClose: 4000,
          closeButton: true,
          hideProgressBar: false
        });
      } else {
        toastify.success('Success!');
      }
    }, 4000);
  }, []);

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
          <div
            className={cn(
              'mx-auto flex w-full flex-col gap-[20px] rounded-[var(--radius)] bg-white p-[15px] shadow-sm md:w-[460px] md:rounded-[var(--radius-lg)] md:p-[20px]',
              'relative'
            )}
          >
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
                sourceChainId={fromChainId}
                targetChainId={toChainId}
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
                chain={toChain}
                onChange={setRecipientAddress}
                error={
                  <AnimatedErrorMessage
                    show={!hasToEnoughBalance && !isToExistentialDepositLoading}
                    message={`You need at least ${toDepositFormatted} in your recipient account on ${toChain?.name} to keep the account alive.`}
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
                  nativeTokenInfo={fromChain?.nativeToken}
                  loading={
                    isNetworkFeeLoading ||
                    isCrossFeeLoading ||
                    isExtrinsicLoading
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
                  isInsufficientBalance ||
                  isInvalid
                }
              >
                Confirm Transaction
              </ConnectOrActionButton>
            </div>
          </div>
        </div>
      )}
      <TransactionManager />
    </>
  );
}
