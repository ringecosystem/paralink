'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { convertToEvmRpcUrls } from '@/lib/utils';
import useChainsStore from '@/store/chains';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useWagmiChainStore } from '@/store/wagmiChain';
import { PolkadotWalletConnectDialog } from '@/components/polkadot-wallet-connect';
import { useState } from 'react';

import type { ButtonProps } from '@/components/ui/button';

interface ConnectOrActionButtonProps extends ButtonProps {
  children?: React.ReactNode;
  isDisabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  connectWalletContent?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onAction?: () => void;
}

export function ConnectOrActionButton({
  children,
  isDisabled = false,
  isLoading = false,
  loadingText,
  connectWalletContent,
  className,
  disabled = false,
  onAction,
  ...props
}: ConnectOrActionButtonProps) {
  const sourceChain = useChainsStore((state) => state.getFromChain());
  const [isPolkadotWalletDialogOpen, setIsPolkadotWalletDialogOpen] =
    useState(false);
  const { isConnected } = useWalletConnection();
  const { setChain } = useWagmiChainStore();
  const { openConnectModal } = useConnectModal();

  const handleClick = () => {
    if (isLoading) return;
    if (!isConnected) {
      if (sourceChain?.isEvmChain && sourceChain?.evmInfo) {
        if (!sourceChain?.providers) return;
        const rpcUrls = convertToEvmRpcUrls(sourceChain?.providers);

        setChain({
          id: Number(sourceChain?.evmInfo?.evmChainId),
          name: sourceChain?.name ?? '',
          nativeCurrency: {
            name: sourceChain?.evmInfo?.symbol ?? '',
            symbol: sourceChain?.evmInfo?.symbol ?? '',
            decimals: sourceChain?.evmInfo?.decimals ?? 18
          },
          rpcUrls
        });
        openConnectModal?.();
      } else {
        setIsPolkadotWalletDialogOpen(true);
      }
      return;
    }
    onAction?.();
  };

  const isButtonDisabled = disabled || isLoading || (isConnected && isDisabled);

  function getButtonContent() {
    if (isLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      );
    }

    if (!isConnected) return connectWalletContent || 'Connect Wallet';

    return children;
  }

  return (
    <>
      <Button
        className={cn('w-full rounded-[10px] font-bold', className)}
        onClick={handleClick}
        disabled={isButtonDisabled}
        {...props}
      >
        {getButtonContent()}
      </Button>
      <PolkadotWalletConnectDialog
        isOpen={isPolkadotWalletDialogOpen}
        onClose={() => setIsPolkadotWalletDialogOpen(false)}
      />
    </>
  );
}
