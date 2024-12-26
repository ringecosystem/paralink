'use client';

import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { FallbackImage } from '@/components/ui/fallback-image';
import FormattedNumberTooltip from '@/components/formatted-number-tooltip';
import { toShortAddress } from '@/lib/utils';
import { BN, BN_ZERO } from '@polkadot/util';

import type { Asset } from '@/types/xcm-asset';

interface AssetPickerItemProps {
  token: Asset;
  balance?: BN;
  isLoading?: boolean;
  onSelect: (token: Asset) => void;
}

export function AssetPickerItem({
  token,
  balance,
  isLoading,
  onSelect
}: AssetPickerItemProps) {
  return (
    <div
      onClick={() => onSelect(token)}
      className="flex w-full cursor-pointer items-center justify-between gap-[10px] rounded-[var(--radius)] px-[10px] py-[10px] transition-all hover:bg-[#12161910] hover:opacity-80"
    >
      <div className="relative h-[34px] w-[34px]">
        <FallbackImage
          src={token?.icon || '/images/default-token.svg'}
          fallbackSrc="/images/default-token.svg"
          alt={token?.symbol || ''}
          fill
          className="rounded-full"
        />
      </div>
      <div className="flex flex-1 items-center gap-[10px]">
        <div className="flex flex-1 flex-col">
          <span className="truncate text-[16px] font-bold leading-normal">
            {token?.symbol}
          </span>
          <div className="item-start flex flex-col gap-[5px] md:flex-row md:items-center">
            <span className="text-[12px] text-[#121619]">{token?.name}</span>
            {/* {token?.contractAddress && (
              <div className="flex items-center gap-[5px]">
                <span className="font-mono text-[12px] tabular-nums text-[#878A92]">
                  {toShortAddress(token.contractAddress)}
                </span>
                <ExternalLink className="h-3 w-3" color="#12161950" />
              </div>
            )} */}
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-[20px] w-[60px]" />
        ) : balance ? (
          <FormattedNumberTooltip
            value={balance ?? BN_ZERO}
            className="text-right font-mono text-[16px] font-bold tabular-nums"
            decimals={token.decimals ?? 0}
          />
        ) : (
          <span className="font-mono tabular-nums">-</span>
        )}
      </div>
    </div>
  );
}
