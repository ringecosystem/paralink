import type { ChainInfoWithXcAssetsData } from '@/store/chains';
import type { Asset } from '@/types/assets-info';

interface ValidateTokenFetchParams {
  fromChain?: ChainInfoWithXcAssetsData;
  toChainId?: string;
  assets: Asset[];
  evmAddress?: string;
  substrateAddress?: string;
}

export function validateTokenFetch({
  fromChain,
  toChainId,
  assets,
  evmAddress,
  substrateAddress
}: ValidateTokenFetchParams): {
  isValid: boolean;
  address?: string;
  error?: string;
} {
  if (!fromChain) return { isValid: false, error: 'From chain not selected' };
  if (!toChainId) return { isValid: false, error: 'To chain not selected' };
  if (!assets?.length) return { isValid: false, error: 'No assets available' };
  const address = fromChain.isEvmChain ? evmAddress : substrateAddress;
  return { isValid: true, address };
}
