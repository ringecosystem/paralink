'use client';

import Image from 'next/image';
import { ChainSelect } from '@/components/chain-select';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';

interface ChainSwitcherProps {
  fromChainId?: string;
  fromChain?: ChainInfoWithXcAssetsData;
  toChainId?: string;
  toChain?: ChainInfoWithXcAssetsData;
  fromParachains?: ChainInfoWithXcAssetsData[];
  toParachains?: ChainInfoWithXcAssetsData[];
  onChangeFromChain: (id: string) => void;
  onChangeToChain: (id: string) => void;
  onSwitch: () => void;
}

export function ChainSwitcher({
  fromChainId,
  fromChain,
  toChainId,
  toChain,
  fromParachains,
  toParachains,
  onChangeFromChain,
  onChangeToChain,
  onSwitch
}: ChainSwitcherProps) {
  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-[10px]">
      <ChainSelect
        label="From"
        value={fromChainId}
        chain={fromChain}
        chains={fromParachains}
        onChange={onChangeFromChain}
      />
      <div className="flex h-full items-center justify-center">
        <div
          className="flex cursor-pointer items-center justify-center rounded-full transition-opacity hover:opacity-80"
          onClick={onSwitch}
        >
          <Image
            src="/images/tansfer.svg"
            alt="assets"
            width={24}
            height={24}
          />
        </div>
      </div>
      <ChainSelect
        label="To"
        value={toChainId}
        chain={toChain}
        chains={toParachains}
        onChange={onChangeToChain}
      />
    </div>
  );
}
