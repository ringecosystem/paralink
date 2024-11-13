import { encodeAddress } from '@polkadot/util-crypto';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';
import type { WalletAccount } from '@talismn/connect-wallets';

export function formatSubstrateAddress({
  account,
  chain
}: {
  account?: WalletAccount;
  chain?: ChainInfoWithXcAssetsData;
}): string | undefined {
  if (
    !account?.address ||
    typeof chain?.substrateInfo?.addressPrefix === 'undefined'
  )
    return undefined;

  try {
    return encodeAddress(account.address, chain.substrateInfo.addressPrefix);
  } catch (error) {
    console.warn('Failed to encode substrate address:', error);
    return account.address;
  }
}
