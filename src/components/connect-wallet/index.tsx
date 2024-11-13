'use client';
import Image from 'next/image';
import { useWalletConnection } from '@/hooks/use-wallet-connection';

import { Connected } from './connected';
import { ConnectOrActionButton } from '../connect-or-action-button';

export default function ConnectWallet() {
  const { isConnected } = useWalletConnection();

  return isConnected ? (
    <Connected />
  ) : (
    <ConnectOrActionButton
      variant="outline"
      className="flex w-auto items-center gap-[5px] rounded-[10px] bg-white px-[10px] py-[8px] text-black transition-opacity hover:opacity-80 hover:shadow-sm"
      disconnectText={false}
    >
      <div className="relative h-[18px] w-[18.645px]">
        <Image src="/images/connect-wallet.svg" alt="wallet" fill />
      </div>

      <span className="text-[14px] font-normal leading-[24px]">
        Connect Wallet
      </span>
    </ConnectOrActionButton>
  );
}
