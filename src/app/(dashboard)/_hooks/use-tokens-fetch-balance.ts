'use client';

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useTokensStore from '@/store/tokens';
import { getAssetBalance } from '@/lib/chain/balance';
import { ChainInfoWithXcAssetsData } from '@/store/chains';
import type { ApiPromise } from '@polkadot/api';

interface UseTokensFetchBalanceProps {
  fromChain?: ChainInfoWithXcAssetsData;
  fromChainApi?: ApiPromise | null;
  address?: string;
}

interface UseTokensFetchBalanceReturn {
  isLoading: boolean;
  error: Error | null;
}

export function useTokensFetchBalance({
  fromChain,
  fromChainApi,
  address
}: UseTokensFetchBalanceProps): UseTokensFetchBalanceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { tokens, selectedToken, setTokensBalance, setSelectedTokenBalance } =
    useTokensStore(
      useShallow((state) => ({
        setTokens: state.setTokens,
        tokens: state.tokens,
        setSelectedToken: state.setSelectedToken,
        selectedToken: state.selectedToken,
        setTokensBalance: state.setTokensBalance,
        setSelectedTokenBalance: state.setSelectedTokenBalance
      }))
    );

  useEffect(() => {
    const fetchBalances = async () => {
      if (!fromChainApi || !address || !fromChain?.substrateInfo?.paraId)
        return;
      try {
        setIsLoading(true);
        const balances = await Promise.all(
          tokens.map((token) =>
            getAssetBalance({
              api: fromChainApi,
              paraId: fromChain?.substrateInfo?.paraId as number,
              account: address,
              xcAssetData: token.xcAssetData
            })
          )
        );

        if (!balances?.length) {
          setTokensBalance([]);
          setSelectedTokenBalance(undefined);
          return;
        }

        const balancesWithSymbol = balances?.map((balance, index) => {
          return {
            balance,
            symbol: tokens[index].symbol
          };
        });

        setTokensBalance(balancesWithSymbol);

        const selectedTokenIndex = balancesWithSymbol.findIndex(
          (balance) => balance.symbol === selectedToken?.symbol
        );
        if (selectedTokenIndex !== -1) {
          setSelectedTokenBalance(balancesWithSymbol[selectedTokenIndex]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch balances')
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [
    fromChainApi,
    fromChain?.substrateInfo?.paraId,
    tokens,
    selectedToken,
    address,
    setTokensBalance,
    setSelectedTokenBalance
  ]);

  return {
    isLoading,
    error
  };
}
