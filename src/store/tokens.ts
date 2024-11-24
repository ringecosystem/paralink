import { create } from 'zustand';

import type { AvailableTokens } from '@/utils/xcm-token';
import type { BN } from '@polkadot/util';

export type BalanceWithSymbol = {
  balance: BN;
  symbol?: string;
};
interface TokensState {
  tokens: AvailableTokens[];
  tokenBalance?: BalanceWithSymbol[];
  selectedToken?: AvailableTokens;
  selectedTokenBalance?: BalanceWithSymbol;
  setTokens: (tokens: AvailableTokens[]) => void;
  setTokensBalance: (balance?: BalanceWithSymbol[]) => void;
  setSelectedToken: (token?: AvailableTokens) => void;
  setSelectedTokenBalance: (balance?: BalanceWithSymbol) => void;
  reset: () => void;
}

const useTokensStore = create<TokensState>((set) => ({
  tokens: [],
  tokenBalance: [],
  selectedToken: undefined,
  selectedTokenBalance: undefined,
  setTokens: (tokens) => set({ tokens, selectedToken: tokens[0] }),
  setTokensBalance: (balance) => set({ tokenBalance: balance }),
  setSelectedToken: (token) => set({ selectedToken: token }),
  setSelectedTokenBalance: (balance) => set({ selectedTokenBalance: balance }),
  reset: () => set({ tokens: [], selectedToken: undefined })
}));

export default useTokensStore;
