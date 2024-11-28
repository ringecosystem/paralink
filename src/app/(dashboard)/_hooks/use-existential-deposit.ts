import { ApiPromise } from '@polkadot/api';
import { BN } from '@polkadot/util';
import { useEffect, useRef, useState } from 'react';
import { AugmentedConst } from '@polkadot/api/types';
import { u128 } from '@polkadot/types';
import type { AccountInfo } from '@polkadot/types/interfaces';

interface ExistentialDepositInfo {
  isLoading: boolean;
  deposit: BN;
  balance: BN;
  symbol: string;
  decimals: number;
  hasEnoughBalance: boolean;
  error?: Error;
}

interface TokenState {
  deposit: BN;
  balance: BN;
  tokenInfo: {
    symbol: string;
    decimals: number;
  };
}

const DEFAULT_TOKEN_STATE: TokenState = {
  deposit: new BN(0),
  balance: new BN(0),
  tokenInfo: {
    symbol: '',
    decimals: 0
  }
};
type Unsubscribe = () => void;

export function useExistentialDeposit({
  api,
  address
}: {
  api: ApiPromise | null;
  address?: string;
}): ExistentialDepositInfo {
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error>();
  const [state, setState] = useState<TokenState>(DEFAULT_TOKEN_STATE);

  useEffect(() => {
    if (!api || !address) {
      setIsLoading(false);
      return;
    }

    const setupBalanceSubscription = async () => {
      try {
        setIsLoading(true);

        const section = 'balances';
        const method = 'existentialDeposit';
        const ed = (await api.consts[section]?.[method]) as u128 &
          AugmentedConst<'promise'>;

        if (!ed) {
          console.error('Failed to fetch existential deposit');
          return;
        }
        const properties = await api.registry.getChainProperties();
        if (!properties) {
          console.error('Failed to fetch chain properties');
          return;
        }

        const tokenInfo = {
          deposit: ed.toBn(),
          tokenInfo: {
            symbol: properties.tokenSymbol.value[0]?.toString() || '',
            decimals: properties.tokenDecimals.value[0]?.toNumber() || 0
          }
        };

        setState((prev) => ({
          ...prev,
          deposit: tokenInfo.deposit,
          tokenInfo: tokenInfo.tokenInfo
        }));

        unsubscribeRef.current = (await api.query.system.account(
          address,
          (accountInfo: AccountInfo) => {
            setState((prev) => ({
              ...prev,
              balance: accountInfo.data.free
            }));
          }
        )) as unknown as Unsubscribe;
      } catch (err) {
        console.error('Balance subscription error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    setupBalanceSubscription();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [api, address]);

  return {
    isLoading,
    balance: state.balance,
    deposit: state.deposit,
    symbol: state.tokenInfo.symbol,
    decimals: state.tokenInfo.decimals,
    hasEnoughBalance: state.balance.gte(state.deposit),
    error
  };
}
