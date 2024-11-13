'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { cn, isValidAddress } from '@/lib/utils';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';

interface RecipientModalProps {
  value: string;
  chain?: ChainInfoWithXcAssetsData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: string) => void;
}

export function RecipientModal({
  value,
  chain,
  isOpen,
  onClose,
  onSave
}: RecipientModalProps) {
  const [address, setAddress] = useState('');
  const [isError, setIsError] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    setIsError(false);
  }, []);

  const handleSave = useCallback(() => {
    if (
      !isValidAddress({
        address,
        chainType: chain?.isEvmChain ? 'evm' : 'substrate',
        expectedPrefix: chain?.substrateInfo?.addressPrefix
      })
    ) {
      setIsError(true);
      return;
    }

    onSave(address);
    setIsError(false);
    onClose();
  }, [address, chain, onSave, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setAddress('');
      setIsError(false);
      return;
    }

    if (value) setAddress(value);
  }, [isOpen, value]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-20px)] gap-0 rounded-[20px] p-[20px] md:w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-[14px] font-bold text-[#121619]">
            Send To
          </DialogTitle>
        </DialogHeader>
        <div className="my-[20px] h-[1px] w-full bg-[#12161910]"></div>

        <div className="flex flex-col gap-[20px]">
          <div className="flex items-center gap-[10px] rounded-[10px] bg-[#F2F3F5] p-[10px]">
            <input
              value={address}
              onChange={handleChange}
              placeholder="Enter recipient address"
              className={cn(
                'w-full bg-transparent text-[14px] font-bold text-[#242A2E] placeholder:text-[#12161950] focus-visible:outline-none',
                isError && 'text-[#FF2D20]',
                !!address && 'font-mono tabular-nums'
              )}
            />
          </div>

          {isError && (
            <p className="text-[12px] font-normal leading-normal text-[#000]">
              Wallet address is invalid for selected destination chain{' '}
              <span className="text-[#FF0083]">{chain?.name}</span>.
            </p>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={!address || isError}
              className="flex-1 font-bold"
            >
              Save
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1 bg-[#FF00831A] font-bold text-[#FF0083] transition-opacity hover:bg-[#FF00831A] hover:opacity-80"
            >
              Cancel
            </Button>
          </div>

          <div className="flex items-center gap-[20px] rounded-[10px] bg-[#FF00831A] p-[20px]">
            <div className="hidden grid-cols-2 gap-[10px] md:grid">
              <Image
                src="/images/wallet/metamask.png"
                width={46}
                height={46}
                alt="MetaMask"
              />
              <Image
                src="/images/wallet/polkadot.png"
                width={46}
                height={46}
                alt="Polkadot"
              />
              <Image
                src="/images/wallet/other.png"
                width={46}
                height={46}
                alt="Other"
              />

              <Image
                src="/images/wallet/plus.svg"
                width={46}
                height={46}
                alt="Add"
              />
            </div>

            <div className="flex flex-col gap-[10px]">
              <p className="text-[14px] font-normal leading-[24px] text-[#242A2E]">
                Connect your wallet to select a destination address
              </p>
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1 bg-[#FF00831A] font-bold text-[#FF0083] transition-opacity hover:bg-[#FF00831A] hover:opacity-80"
              >
                Connect Now
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
