import { useAccount } from 'wagmi';
import { formatSubstrateAddress } from '@/utils/address';
import { useWalletStore } from '@/store/wallet';
import useChainsStore from '@/store/chains';

interface WalletConnection {
  isConnected: boolean;
  evmAddress?: `0x${string}`;
  substrateAddress?: string;
  isWrongNetwork: boolean;
  currentAddress?: string;
}

export function useWalletConnection(): WalletConnection {
  const fromChain = useChainsStore((state) => state.getFromChain());
  const { address, chainId } = useAccount();
  const { selectedAccount } = useWalletStore();

  if (!fromChain) return { isConnected: false, isWrongNetwork: false };

  const isWrongNetwork =
    fromChain?.isEvmChain && fromChain?.evmInfo
      ? chainId !== fromChain?.evmInfo?.evmChainId
      : false;

  const substrateAddress = formatSubstrateAddress({
    account: selectedAccount ?? undefined,
    chain: fromChain
  });

  const getConnectedAddress = () => {
    if (fromChain?.isEvmChain) return !!address;
    return !!selectedAccount?.address;
  };

  return {
    isConnected: getConnectedAddress(),
    evmAddress: address,
    substrateAddress,
    isWrongNetwork,
    currentAddress: fromChain.isEvmChain ? address : selectedAccount?.address
  };
}
