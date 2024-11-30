import { create } from 'zustand';

import type { AvailableToken } from '@/utils/xcm-token';

interface TokensState {
  selectedToken?: AvailableToken;
  setSelectedToken: (token?: AvailableToken) => void;
}

const useTokensStore = create<TokensState>((set) => ({
  selectedToken: undefined,
  setSelectedToken: (token) => set({ selectedToken: token })
}));

export default useTokensStore;
