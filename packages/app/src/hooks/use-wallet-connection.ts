import { useAccount } from 'wagmi';
import { formatSubstrateAddress } from '@/utils/address';
import { useWalletStore } from '@/store/wallet';
import useChainsStore from '@/store/chains';

interface WalletConnection {
  isConnected: boolean;
  evmAddress?: `0x${string}`;
  substrateAddress?: string;
  baseSubstrateAddress?: string;
  address?: string;
  isWrongNetwork: boolean;
  currentAddress?: string;
}

export function useWalletConnection(): WalletConnection {
  const sourceChain = useChainsStore((state) => state.getFromChain());
  const { address, chainId } = useAccount();
  const { selectedAccount } = useWalletStore();

  if (!sourceChain) return { isConnected: false, isWrongNetwork: false };

  const isWrongNetwork =
    sourceChain?.isEvm && sourceChain?.evmChainId
      ? chainId !== sourceChain?.evmChainId
      : false;

  const substrateAddress = formatSubstrateAddress({
    account: selectedAccount ?? undefined,
    chain: sourceChain
  });

  const getConnectedAddress = () => {
    if (sourceChain?.isEvm) return !!address;
    return !!selectedAccount?.address;
  };

  return {
    isConnected: getConnectedAddress(),
    evmAddress: address,
    substrateAddress,
    baseSubstrateAddress: selectedAccount?.address,
    address: sourceChain.isEvm ? address : selectedAccount?.address,
    isWrongNetwork,
    currentAddress: sourceChain.isEvm ? address : selectedAccount?.address
  };
}
