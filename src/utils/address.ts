import { encodeAddress } from '@polkadot/util-crypto';
import type { ChainConfig } from '@/types/registry';
import type { WalletAccount } from '@talismn/connect-wallets';


export function formatSubstrateAddress({
  account,
  chain
}: {
  account?: WalletAccount;
  chain?: ChainConfig;
}): string | undefined {
  if (
    !account?.address ||
    typeof chain?.addressPrefix === 'undefined'
  )
    return undefined;

  try {
    return encodeAddress(account.address, chain.addressPrefix);
  } catch (error) {
    console.warn('Failed to encode substrate address:', error);
    return account.address;
  }
}
