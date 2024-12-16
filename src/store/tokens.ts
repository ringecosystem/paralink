import { create } from 'zustand';

import type { Asset } from '@/types/xcm-asset';

interface TokensState {
  selectedToken?: Asset;
  setSelectedToken: (token?: Asset) => void;
}

const useTokensStore = create<TokensState>((set) => ({
  selectedToken: undefined,
  setSelectedToken: (token) => set({ selectedToken: token })
}));

export default useTokensStore;
