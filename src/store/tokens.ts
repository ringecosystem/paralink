import { create } from 'zustand';

import type { AvailableTokens } from '@/utils/xcm-token';

interface TokensState {
  tokens: AvailableTokens[];
  selectedToken?: AvailableTokens;
  setTokens: (tokens: AvailableTokens[]) => void;
  setSelectedToken: (token?: AvailableTokens) => void;
  reset: () => void;
}

const useTokensStore = create<TokensState>((set) => ({
  tokens: [],
  selectedToken: undefined,
  setTokens: (tokens) => set({ tokens, selectedToken: tokens[0] }),
  setSelectedToken: (token) => set({ selectedToken: token }),
  reset: () => set({ tokens: [], selectedToken: undefined })
}));

export default useTokensStore;
