'use client';

import { useCallback, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FallbackImage } from '@/components/ui/fallback-image';
import { TokenSelectDialog } from './token-select-dialog';
import { useNumberInput } from '@/hooks/number-input';
import { cn } from '@/lib/utils';
import { TokenWithBalance } from '@/types/token';

interface TokenSelectProps {
  token?: TokenWithBalance;
  tokens?: TokenWithBalance[];
  onChangeToken?: (token: TokenWithBalance) => void;
  onChangeAmount?: (value: string) => void;
}

export function TokenSelect({
  token,
  tokens,
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
              <span className="text-[12px] font-normal leading-normal text-[#12161950]">
                Balance:
                <span className="font-mono tabular-nums">
                  {token?.balance || '0.00'}
                </span>
              </span>
            </div>
            <div className="flex flex-col items-end">
              <input
                className={cn(
                  'w-full bg-transparent text-right font-mono text-[18px] font-bold tabular-nums text-[#12161950] focus-visible:outline-none',
                  'md:text-[24px]',
                  value && 'text-[#121619]'
                )}
                placeholder="0.00"
                type="number"
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <span className="text-[12px] font-normal leading-normal text-[#12161950]">
                ≈ ${' '}
                <span className="font-mono tabular-nums">
                  {token?.balance || '0.00'}
                </span>
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
        onClose={() => setIsDialogOpen(false)}
        onSelect={handleSelect}
        tokens={tokens || []}
      />
    </>
  );
}
