import { useRef, useState } from 'react';
import { isNil } from 'lodash-es';
import { BN, bnToBn } from '@polkadot/util';
import { formatTokenBalance } from '@/utils/format';
import useApiConnectionsStore from '@/store/api-connections';
import type { AccountInfo } from '@polkadot/types/interfaces';
import type { ChainConfig } from '@/types/xcm-asset';
import { useDebounceEffect } from '@/hooks/use-debounce-effect';

interface ExistentialDepositInfo {
  isLoading: boolean;
  deposit: BN;
  formattedDeposit: string;
  balance: BN;
  formattedBalance: string;
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
  chain,
  address
}: {
  chain?: ChainConfig;
  address?: string;
}): ExistentialDepositInfo {
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error>();
  const [state, setState] = useState<TokenState>(DEFAULT_TOKEN_STATE);
  const getValidApi = useApiConnectionsStore((state) => state.getValidApi);

  useDebounceEffect(() => {
    setIsLoading(false);
    setState(DEFAULT_TOKEN_STATE);
    setError(undefined);
    if (!chain || !address) {
      setIsLoading(false);
      setState(DEFAULT_TOKEN_STATE);
      return;
    }

    const setupBalanceSubscription = async () => {
      try {
        setIsLoading(true);
        if (isNil(chain?.id)) return;
        const api = await getValidApi(chain?.id);

        const properties = await api.registry.getChainProperties();
        if (!properties) {
          console.error('Failed to fetch chain properties');
          return;
        }

        const tokenInfo = {
          deposit: bnToBn(chain?.existentialDeposit),
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
        console.log('useExistentialDeposit', address, chain);

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
  }, [getValidApi, address, chain?.id]);

  return {
    isLoading,
    balance: state.balance,
    formattedBalance: formatTokenBalance(state.balance, {
      decimals: state.tokenInfo.decimals,
      symbol: state.tokenInfo.symbol
    }),
    deposit: state.deposit,
    formattedDeposit: formatTokenBalance(state.deposit, {
      decimals: state.tokenInfo.decimals,
      symbol: state.tokenInfo.symbol
    }),
    symbol: state.tokenInfo.symbol,
    decimals: state.tokenInfo.decimals,
    hasEnoughBalance: state.balance.gte(state.deposit),
    error
  };
}
