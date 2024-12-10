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
    sourceChain?.isEvmChain && sourceChain?.evmInfo
      ? chainId !== sourceChain?.evmInfo?.evmChainId
      : false;

  const substrateAddress = formatSubstrateAddress({
    account: selectedAccount ?? undefined,
    chain: sourceChain
  });

  const getConnectedAddress = () => {
    if (sourceChain?.isEvmChain) return !!address;
    return !!selectedAccount?.address;
  };

  return {
    isConnected: getConnectedAddress(),
    evmAddress: address,
    substrateAddress,
    baseSubstrateAddress: selectedAccount?.address,
    address: sourceChain.isEvmChain ? address : selectedAccount?.address,
    isWrongNetwork,
    currentAddress: sourceChain.isEvmChain ? address : selectedAccount?.address
  };
}
