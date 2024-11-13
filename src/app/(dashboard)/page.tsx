'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AddressInput } from '@/components/address-input';
import Alert from '@/components/alert';
import { FeeBreakdown } from '@/components/fee-breakdown';
import { TokenSelect } from '@/components/token-select';
import { Button } from '@/components/ui/button';
import { ConnectOrActionButton } from '@/components/connect-or-action-button';
// import { TransactionDetail } from '@/components/transaction-detail';
import useChainsStore from '@/store/chains';
import { ChainSwitcher } from './_components/chain-switcher';
import Loading from './_components/loading';

import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { useChainInitialization } from './_hooks/use-chain-initlization';
import { useCrossChainSetup } from './_hooks/use-cross-chain-setup';
import useTokensStore from '@/store/tokens';
import { useApiConnection } from './_hooks/use-api-connection';
import { getTokensWithBalanceForChain } from '@/services/tokens';

export default function Dashboard() {
  const [amount, setAmount] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');

  const { substrateAddress, evmAddress } = useWalletConnection();
  const { isLoading, isError, assets } = useChainInitialization();
  const { setupCrossChainConfig, swapChains } = useCrossChainSetup();
  const {
    chains,
    fromChainId,
    fromChains,
    fromChain,
    toChainId,
    setToChainId,
    toChain,
    toChains
  } = useChainsStore(
    useShallow((state) => ({
      chains: state.chains,
      setChains: state.setChains,
      fromChainId: state.fromChainId,
      toChainId: state.toChainId,
      setToChainId: state.setToChainId,
      fromChains: state.fromChains,
      toChains: state.toChains,
      fromChain: state.getFromChain(),
      toChain: state.getToChain()
    }))
  );
  const { setTokens, tokens, setSelectedToken, selectedToken } = useTokensStore(
    useShallow((state) => ({
      setTokens: state.setTokens,
      tokens: state.tokens,
      setSelectedToken: state.setSelectedToken,
      selectedToken: state.selectedToken
    }))
  );

  // init from chain api
  const { fromChainApi } = useApiConnection({ fromChain });

  const fetchTokens = useCallback(async () => {
    if (!fromChain || !toChainId || !assets.length) return;
    const tokens = await getTokensWithBalanceForChain({
      fromChain,
      toChainId,
      fromChainApi,
      assets,
      evmAddress,
      substrateAddress
    });

    if (tokens?.length) {
      setTokens(tokens);
      setSelectedToken(tokens[0]);
    }
  }, [
    fromChain,
    toChainId,
    fromChainApi,
    assets,
    setTokens,
    setSelectedToken,
    evmAddress,
    substrateAddress
  ]);

  const handleChangeFromChainId = useCallback(
    (id: string) => {
      setupCrossChainConfig(chains, id);
    },
    [chains, setupCrossChainConfig]
  );

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

  const handleClick = useCallback(() => {
    console.log('amount', amount);
  }, [amount]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return (
    <>
      <div className="container absolute left-0 right-0 top-[calc(var(--header-height)+10px)]">
        <Alert
          message={
            <p className="space-x-[10px]">
              <strong>Bridge Tokens with Paralink! </strong>
              <span>
                Paralink makes it easy to take your tokens interchain.
              </span>
              <a
                className="font-bold"
                href="https://github.com/ringecosystem/paralink/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get started now↗
              </a>
            </p>
          }
          closable={true}
        />
      </div>
      {isLoading ? (
        <Loading />
      ) : isError ? (
        <div className="container flex flex-col gap-[30px] pt-[min(120px,15vh)] md:pt-[min(100px,12vh)]">
          <div className="mx-auto flex w-full flex-col items-center gap-6 rounded-[var(--radius)] bg-white p-6 text-center shadow-sm md:w-[460px] md:rounded-[var(--radius-lg)]">
            <div className="rounded-full bg-red-50 p-4">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Failed to Load
              </h3>
              <p className="text-sm text-gray-500">
                Unable to fetch required data. Please check your network
                connection and try again.
              </p>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reload
            </Button>
          </div>
        </div>
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
              onChangeToChain={setToChainId}
              onSwitch={handleSwitch}
            />

            <TokenSelect
              token={selectedToken}
              onChangeToken={setSelectedToken}
              onChangeAmount={setAmount}
              tokens={tokens}
            />

            <AddressInput
              value={recipientAddress}
              chain={toChain}
              onChange={setRecipientAddress}
            />
            <FeeBreakdown
              amount={100}
              networkFee={0.01}
              crossChainFee={0.02}
              finalAmount={99.97}
            />
            <div className="h-[1px] w-full bg-[#F2F3F5]"></div>

            <ConnectOrActionButton onAction={handleClick}>
              Confirm Transaction
            </ConnectOrActionButton>
          </div>

          {/* <TransactionDetail isOpen={true} onClose={() => {}} /> */}
        </div>
      )}
    </>
  );
}
