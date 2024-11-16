'use client';

import { useCallback, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FallbackImage } from '@/components/ui/fallback-image';
import { useNumberInput } from '@/hooks/number-input';
import { cn } from '@/lib/utils';
import { TokenSelectDialog } from './token-select-dialog';
import type { TokenWithBalance } from '@/types/token';
import FormattedNumberTooltip from './formatted-number-tooltip';

interface TokenSelectProps {
  token?: TokenWithBalance;
  tokens?: TokenWithBalance[];
  isLoading?: boolean;
  onChangeToken?: (token: TokenWithBalance) => void;
  onChangeAmount?: (value: string) => void;
}

export function TokenSelect({
  token,
  tokens,
  isLoading,
  onChangeToken,
  onChangeAmount
}: TokenSelectProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { value, handleChange, handleBlur } = useNumberInput({
    // maxDecimals: 6,
    // maxValue: 1000000,
    maxDecimals: 10000,
    minValue: 0,
    initialValue: '',
    onChange: onChangeAmount
  });

  function handleOpenDialog() {
    if (!tokens?.length) {
      return;
    }
    setIsDialogOpen(true);
  }

  const handleSelect = useCallback(
    (token: TokenWithBalance) => {
      console.log('token', token);

      onChangeToken?.(token);
      setIsDialogOpen(false);
    },
    [onChangeToken]
  );

  return (
    <>
      {token ? (
        <div className="flex items-center gap-[10px] rounded-[10px] bg-[#F2F3F5] p-[10px]">
          <div className="relative h-[40px] w-[40px] flex-shrink-0">
            <FallbackImage
              src={token?.icon ?? '/images/default-token.svg'}
              fallbackSrc="/images/default-token.svg"
              alt={token?.symbol ?? 'no icon'}
              fill
            />
          </div>

          <div className="grid w-full grid-cols-2 items-center gap-[10px]">
            <div
              className={cn(
                'flex cursor-pointer flex-col items-start transition-opacity hover:opacity-80',
                !tokens?.length && 'pointer-events-none opacity-50'
              )}
              onClick={handleOpenDialog}
            >
              <div className="flex items-center gap-[5px] leading-normal">
                <span className="text-[18px] font-bold">
                  {token?.symbol || ''}
                </span>
                <ChevronDown className="h-4 w-4" />
              </div>
              <span className="flex items-center text-[12px] font-normal leading-normal text-[#12161950]">
                Balance:
                {token?.balance ? (
                  <FormattedNumberTooltip
                    value={token.balance}
                    decimals={token.decimals ?? 0}
                  />
                ) : (
                  <span className="font-mono tabular-nums">0.000</span>
                )}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <input
                className={cn(
                  'w-full bg-transparent text-right font-mono text-[18px] font-bold tabular-nums text-[#12161950] focus-visible:outline-none',
                  'md:text-[24px]',
                  value && 'text-[#121619]'
                )}
                placeholder="0.000"
                type="number"
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <span className="flex items-center text-[12px] font-normal leading-normal text-[#12161950]">
                ≈ ${' '}
                {token?.balance ? (
                  <FormattedNumberTooltip
                    value={token.balance}
                    decimals={token.decimals ?? 0}
                  />
                ) : (
                  <span className="font-mono tabular-nums">0.000</span>
                )}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[10px] bg-[#c6c6c6] p-[20px] text-center text-[16px] font-normal leading-normal text-white">
          No Tokens Available
        </div>
      )}

      <TokenSelectDialog
        isOpen={isDialogOpen}
        isLoading={isLoading}
        onClose={() => setIsDialogOpen(false)}
        onSelect={handleSelect}
        tokens={tokens || []}
      />
    </>
  );
}
