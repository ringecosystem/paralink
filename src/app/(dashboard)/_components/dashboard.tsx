'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AddressInput } from '@/components/address-input';
import Alert from '@/components/alert';
import { FeeBreakdown } from '@/components/fee-breakdown';
import { TokenSelect } from '@/components/token-select';
import { ConnectOrActionButton } from '@/components/connect-or-action-button';
// import { TransactionDetail } from '@/components/transaction-detail';
import useChainsStore from '@/store/chains';
import useTokensStore from '@/store/tokens';
import { getTokensWithBalanceForChain } from '@/services/tokens';
// import { getAcceptablePaymentAsset } from '@/services/xcm/polkadot-xcm';
import { useWalletConnection } from '@/hooks/use-wallet-connection';

import { useChainInitialization } from '../_hooks/use-chain-initlization';
import { useCrossChainSetup } from '../_hooks/use-cross-chain-setup';
import { useApiConnection } from '../_hooks/use-api-connection';
import { ChainSwitcher } from './chain-switcher';
import type { ChainConfig } from '@/types/asset-registry';
import type { ChainInfo } from '@/types/chains-info';
import type { Asset } from '@/types/assets-info';
import Loading from './loading';
import { calculateExecutionWeight } from '@/services/xcm/xcm-weight';

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
  const [recipientAddress, setRecipientAddress] = useState<string>(
    '0x3d6d656c1bf92f7028Ce4C352563E1C363C58ED5'
  );

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

  const { substrateAddress, evmAddress } = useWalletConnection();

  const { setupCrossChainConfig, swapChains } = useCrossChainSetup();

  // init chains and setup cross chain config
  const { isLoading } = useChainInitialization({
    polkadotAssetRegistry,
    chainsInfo
  });

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
    if (!fromChain || !toChain || !assetsInfo.length) return;
    const tokens = await getTokensWithBalanceForChain({
      fromChain,
      toChain,
      fromChainApi,
      assets: assetsInfo,
      evmAddress,
      substrateAddress
    });

    if (tokens?.length) {
      setTokens(tokens);
      setSelectedToken(tokens[0]);
    } else {
      console.log('no tokens');
      setTokens([]);
      setSelectedToken(undefined);
    }
  }, [
    fromChain,
    toChain,
    fromChainApi,
    assetsInfo,
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

  const handleClick = useCallback(async () => {
    if (!fromChainId || !toChainId) return;
    // const validationResult = await validateHrmpConnection({
    //   fromChainId,
    //   toChainId,
    //   chainsInfo
    // });
    // console.log('validationResult', validationResult);
    if (!fromChainApi || !selectedToken?.xcAssetData || !toChain) return;

    const weight = await calculateExecutionWeight({
      api: fromChainApi,
      token: selectedToken.xcAssetData,
      amount,
      toChain,
      recipientAddress
    });
    console.log('weight', weight);
    // console.log('fromChainApi', fromChainApi);
    // const crossTokenLocation = await getAcceptablePaymentAsset(fromChainApi);
    // console.log('crossTokenLocation', crossTokenLocation);
    // console.log('amount', amount);
  }, [
    amount,
    fromChainApi,
    fromChainId,
    toChainId,
    // chainsInfo,
    recipientAddress,
    selectedToken?.xcAssetData,
    toChain
  ]);

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
              isLoading={false}
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
