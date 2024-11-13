import { create } from 'zustand';
import type { TokenWithBalance } from '@/types/token';

interface TokensState {
  tokens: TokenWithBalance[];
  selectedToken?: TokenWithBalance;
  setTokens: (tokens: TokenWithBalance[]) => void;
  setSelectedToken: (token?: TokenWithBalance) => void;
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
