'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import Image from 'next/image';
import { useWalletStore } from '@/store/wallet';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PolkadotWalletOption {
  id: string;
  name: string;
  icon: string;
}

const walletOptions: PolkadotWalletOption[] = [
  {
    id: 'talisman',
    name: 'Talisman',
    icon: '/images/wallet/talisman.png'
  },
  {
    id: 'polkadot-js',
    name: 'Polkadot',
    icon: '/images/wallet/polkadot.png'
  },
  {
    id: 'subwallet-js',
    name: 'Subwallet',
    icon: '/images/wallet/subwallet.png'
  }
];

interface PolkadotWalletConnectDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PolkadotWalletConnectDialog({
  isOpen,
  onClose
}: PolkadotWalletConnectDialogProps) {
  const { connectWallet, isConnecting } = useWalletStore();

  const handleWalletSelect = async (walletId: string) => {
    try {
      await connectWallet(walletId);
      onClose();
    } catch (error) {
      console.log('error', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to connect wallet',
        {
          duration: 3_000
        }
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-20px)] rounded-[10px] md:w-[400px]">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-[20px]">
          {walletOptions.map((wallet) => (
            <div
              key={wallet.id}
              onClick={() => handleWalletSelect(wallet.id)}
              className="flex w-full cursor-pointer items-center gap-[20px] rounded-[10px] bg-[#F2F3F5] p-[20px] transition-opacity hover:opacity-80"
            >
              <div className="relative h-[54px] w-[54px]">
                <Image
                  src={wallet.icon}
                  alt={wallet.name}
                  fill
                  className="rounded-full"
                />
              </div>
              <span className="text-[18px] font-bold">{wallet.name}</span>
              {isConnecting && (
                <Loader2 className="ml-auto h-4 w-4 animate-spin" />
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
