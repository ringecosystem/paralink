'use client';

import { useCallback, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FallbackImage } from '@/components/ui/fallback-image';
import { useNumberInput } from '@/hooks/number-input';
import { cn } from '@/lib/utils';
import { BalanceWithSymbol, TokenSelectDialog } from './token-select-dialog';
import FormattedNumberTooltip from './formatted-number-tooltip';
import { BN, BN_ZERO, bnToBn, formatBalance } from '@polkadot/util';
import type { AvailableTokens } from '@/utils/xcm-token';
import { formatTokenBalance } from '@/utils/format';

interface TokenSelectProps {
  token?: AvailableTokens;
  tokenBalance?: BalanceWithSymbol;
  tokens?: AvailableTokens[];
  tokenBalances?: BalanceWithSymbol[];
  minBalance?: BN;
  maxBalance?: BN;
  isLoading?: boolean;
  error?: React.ReactNode;
  onChangeToken?: (token: AvailableTokens) => void;
  onChangeAmount?: (value: string) => void;
}

export function TokenSelect({
  token,
  tokens,
  tokenBalance,
  tokenBalances,
  minBalance,
  maxBalance,
  isLoading,
  error,
  onChangeToken,
  onChangeAmount
}: TokenSelectProps) {
  const min = minBalance ? minBalance.toNumber() : 0;
  const max = maxBalance ? maxBalance.toNumber() : 0;
  const price = undefined;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { value, handleChange, handleBlur } = useNumberInput({
    maxDecimals: token?.decimals ?? 18,
    // minValue: min,
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
    (token: AvailableTokens) => {
      onChangeToken?.(token);
      setIsDialogOpen(false);
    },
    [onChangeToken]
  );

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  return (
    <>
      {token ? (
        <div>
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
                  {typeof tokenBalance?.balance !== 'undefined' ? (
                    <FormattedNumberTooltip
                      value={tokenBalance?.balance}
                      decimals={token.decimals ?? 0}
                    />
                  ) : (
                    <span className="font-mono tabular-nums">-</span>
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
                  {price ? (
                    <FormattedNumberTooltip
                      // value={token.price ?? BN_ZERO}
                      value={BN_ZERO}
                      decimals={token.decimals ?? 0}
                    />
                  ) : (
                    <span className="font-mono tabular-nums">0.000</span>
                  )}
                </span>
              </div>
            </div>
          </div>
          {
            <div className="flex items-center justify-end gap-2 px-2 text-[11px] text-primary">
              <span>
                Min:{' '}
                {formatTokenBalance(minBalance ?? BN_ZERO, {
                  decimals: token.decimals,
                  symbol: token?.symbol
                })}
              </span>
              {<span>•</span>}
              <span>
                Max:{' '}
                {formatTokenBalance(maxBalance ?? BN_ZERO, {
                  decimals: token.decimals,
                  symbol: token?.symbol
                })}
              </span>
            </div>
          }
          {error && <div className="mt-1 text-xs">{error}</div>}
        </div>
      ) : (
        <div className="rounded-[10px] bg-[#c6c6c6] p-[20px] text-center text-[16px] font-normal leading-normal text-white">
          No Tokens Available
        </div>
      )}

      <TokenSelectDialog
        isOpen={isDialogOpen}
        isLoading={isLoading}
        tokenBalances={tokenBalances}
        onClose={handleCloseDialog}
        onSelect={handleSelect}
        tokens={tokens || []}
      />
    </>
  );
}
