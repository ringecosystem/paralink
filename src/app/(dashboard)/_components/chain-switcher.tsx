'use client';

import Image from 'next/image';
import { ChainSelect } from '@/components/chain-select';
import type { ChainConfig } from '@/types/registry';

interface ChainSwitcherProps {
  sourceChainId?: number;
  sourceChain?: ChainConfig;
  targetChainId?: number;
  targetChain?: ChainConfig;
  fromParachains?: ChainConfig[];
  toParachains?: ChainConfig[];
  onChangeFromChain: (id: number) => void;
  onChangeToChain: (id: number) => void;
  onSwitch: () => void;
}

export function ChainSwitcher({
  sourceChainId,
  sourceChain,
  targetChainId,
  targetChain,
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
        value={sourceChainId}
        chain={sourceChain}
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
        value={targetChainId}
        chain={targetChain}
        chains={toParachains}
        onChange={onChangeToChain}
      />
    </div>
  );
}
