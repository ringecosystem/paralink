'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import useChainsStore from '@/store/chains';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tabs } from './tabs';
import { toShortAddress } from '@/lib/utils';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
export function Connected() {
  const { evmAddress, substrateAddress } = useWalletConnection();

  const fromChain = useChainsStore((state) => state.getFromChain());

  const currentChainInfo = useMemo(() => {
    if (fromChain?.isEvmChain && evmAddress) {
      return {
        icon: '/images/wallet/metamask.png',
        name: fromChain.name,
        address: evmAddress || ''
      };
    } else if (fromChain?.substrateInfo && substrateAddress) {
      return {
        icon: '/images/wallet/polkadot.png',
        name: fromChain.name,
        address: substrateAddress || ''
      };
    }
    return null;
  }, [fromChain, evmAddress, substrateAddress]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-[5px] px-[10px] py-[8px]">
          {currentChainInfo?.icon ? (
            <Image
              src={currentChainInfo?.icon}
              alt={currentChainInfo?.name || ''}
              width={24}
              height={24}
            />
          ) : null}

          <span
            className="text-[14px] font-normal text-[#242A2E]"
            title={currentChainInfo?.address || ''}
          >
            {toShortAddress(currentChainInfo?.address || '')}
          </span>
          <Image
            src="/images/arrow-down.svg"
            alt="arrow"
            width={16}
            height={16}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-0" align="end">
        <Tabs />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
