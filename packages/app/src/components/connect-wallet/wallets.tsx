'use client';
import Image from 'next/image';
import { LogOut } from 'lucide-react';
import { blo } from 'blo';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { useDisconnectWallet } from '@/hooks/disconnect-wallet';
import { toShortAddress } from '@/lib/utils';
import { useWalletStore } from '@/store/wallet';
import ClipboardIconButton from '../clipboard-icon-button';

export const Wallets = () => {
  const { substrateAddress, evmAddress } = useWalletConnection();
  const { disconnectWallet } = useDisconnectWallet();
  const { disconnect } = useWalletStore();
  return (
    <div className="flex flex-col gap-[10px]">
      {!!evmAddress && (
        <div className="flex flex-col gap-[10px]">
          <div className="flex items-center gap-[5px]">
            <Image
              src="/images/wallet/ethereum.svg"
              alt="wallet"
              width={20}
              height={20}
            />
            <span className="text-[14px] font-bold leading-normal text-[#242A2E]">
              Ethereum
            </span>
          </div>
          <div className="flex w-full items-center justify-between rounded-[10px] bg-[#F2F3F5] px-[10px] py-[5px] text-[12px] font-normal leading-normal">
            <div className="flex items-center gap-[5px]">
              <Image
                src={blo(evmAddress as `0x${string}`)}
                alt={evmAddress}
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className="text-[12px] font-normal tabular-nums leading-normal text-[#242A2E]">
                {toShortAddress(evmAddress as `0x${string}`)}
              </span>
              <ClipboardIconButton
                text={evmAddress as `0x${string}`}
                size={14}
                className="cursor-pointer opacity-50 transition-opacity hover:opacity-80"
              />
            </div>
            <LogOut
              size={14}
              color="#121619"
              onClick={() => disconnectWallet(evmAddress as `0x${string}`)}
              className="cursor-pointer opacity-50 transition-opacity hover:opacity-80"
            />
          </div>
        </div>
      )}

      {!!substrateAddress && (
        <div className="flex flex-col gap-[10px]">
          <div className="flex items-center gap-[5px]">
            <Image
              src="/images/wallet/polkadot.svg"
              alt="wallet"
              width={20}
              height={20}
            />
            <span className="text-[14px] font-bold leading-normal text-[#242A2E]">
              POLKADOT
            </span>
          </div>
          <div className="flex w-full items-center justify-between rounded-[10px] bg-[#F2F3F5] px-[10px] py-[5px] text-[12px] font-normal leading-normal">
            <div className="flex items-center gap-[5px]">
              <Image
                src={blo(substrateAddress as `0x${string}`)}
                alt={substrateAddress as `0x${string}`}
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className="text-[12px] font-normal tabular-nums leading-normal text-[#242A2E]">
                {toShortAddress(substrateAddress || '')}
              </span>
              <ClipboardIconButton
                text={substrateAddress}
                size={14}
                className="cursor-pointer opacity-50 transition-opacity hover:opacity-80"
              />
            </div>
            <LogOut
              size={14}
              color="#121619"
              onClick={() => disconnect()}
              className="cursor-pointer opacity-50 transition-opacity hover:opacity-80"
            />
          </div>
        </div>
      )}
    </div>
  );
};
