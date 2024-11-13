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
  children: React.ReactNode;
  disconnectText?: string | boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
  disabled?: boolean;
  onAction?: () => void;
}

export function ConnectOrActionButton({
  children,
  disconnectText = 'Disconnect Wallet',
  isDisabled = false,
  isLoading = false,
  className,
  disabled = false,
  onAction,
  ...props
}: ConnectOrActionButtonProps) {
  const fromChain = useChainsStore((state) => state.getFromChain());
  const [isPolkadotWalletDialogOpen, setIsPolkadotWalletDialogOpen] =
    useState(false);
  const { isConnected } = useWalletConnection();
  const { setChain } = useWagmiChainStore();
  const { openConnectModal } = useConnectModal();

  const handleClick = () => {
    if (isLoading) return;
    if (!isConnected) {
      if (fromChain?.isEvmChain && fromChain?.evmInfo) {
        if (!fromChain?.providers) return;
        const rpcUrls = convertToEvmRpcUrls(fromChain?.providers);

        setChain({
          id: Number(fromChain?.evmInfo?.evmChainId),
          name: fromChain?.name ?? '',
          nativeCurrency: {
            name: fromChain?.evmInfo?.symbol ?? '',
            symbol: fromChain?.evmInfo?.symbol ?? '',
            decimals: fromChain?.evmInfo?.decimals ?? 18
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

  return (
    <>
      <Button
        className={cn('w-full rounded-[10px] font-bold', className)}
        onClick={handleClick}
        disabled={isButtonDisabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isConnected && !!disconnectText ? 'Connect Wallet' : children}
      </Button>
      <PolkadotWalletConnectDialog
        isOpen={isPolkadotWalletDialogOpen}
        onClose={() => setIsPolkadotWalletDialogOpen(false)}
      />
    </>
  );
}
