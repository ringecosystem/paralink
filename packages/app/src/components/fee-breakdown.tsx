'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FallbackImage } from './ui/fallback-image';
import { BN, BN_ZERO, bnMax } from '@polkadot/util';
import { Skeleton } from './ui/skeleton';
import FormattedNumberTooltip from './formatted-number-tooltip';
import { Asset } from '@/types/xcm-asset';
import FormattedUsdTooltip from './formatted-usd-tooltip';

const variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      },
      opacity: {
        duration: 0.2,
        delay: 0.1
      }
    }
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      },
      opacity: {
        duration: 0.2
      }
    }
  }
};

interface FeeBreakdownProps {
  showValue: boolean;
  amount: BN;
  networkFee: BN;
  crossFee: BN;
  nativeTokenInfo?: Asset;
  xcmTokenInfo?: Asset;
  loading?: boolean;
  prices?: Record<string, number>;
}

export function FeeBreakdown({
  showValue,
  amount,
  networkFee,
  crossFee,
  nativeTokenInfo,
  xcmTokenInfo,
  loading,
  prices
}: FeeBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const finalAmount = bnMax(amount.sub(crossFee), BN_ZERO);

  return (
    <div className="flex w-full flex-col gap-[10px] rounded-[10px] bg-[#F2F3F5] p-[10px] text-[14px] font-normal">
      <motion.div
        className="flex w-full cursor-pointer items-center justify-between gap-[10px] rounded-[10px]"
        onClick={() => setIsExpanded(!isExpanded)}
        whileTap={{ scale: 0.98 }}
      >
        <span
          className={cn(
            'text-sm leading-[24px] text-[#12161950]',
            isExpanded && 'text-[#242A2E]'
          )}
        >
          Receive (Estimated)
        </span>
        <div className="flex items-center gap-2">
          <FormattedNumberTooltip
            value={finalAmount}
            decimals={xcmTokenInfo?.decimals ?? 3}
          >
            {(formattedValue: string) => (
              <span
                className={cn(
                  'max-w-[160px] truncate text-[14px] font-bold tabular-nums text-[#12161950]',
                  isExpanded && 'text-[#242A2E]'
                )}
              >
                {formattedValue}
              </span>
            )}
          </FormattedNumberTooltip>

          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-[#121619]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#121619]" />
          )}
        </div>
      </motion.div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="space-y-[10px]">
              <div className="flex items-center justify-between">
                <span className="leading-[24px]">Network Fee</span>
                {typeof networkFee !== 'boolean' && showValue ? (
                  <div className="flex flex-shrink-0 items-center gap-[10px]">
                    {nativeTokenInfo?.priceId &&
                    prices?.[nativeTokenInfo?.priceId] ? (
                      <span className="hidden text-[#12161950] sm:block">
                        <FormattedUsdTooltip
                          value={networkFee}
                          decimals={nativeTokenInfo?.decimals ?? 3}
                          displayDecimals={3}
                          price={prices?.[nativeTokenInfo?.priceId] ?? 0}
                        >
                          {(formattedValue: string) => (
                            <span className="tabular-nums">
                              ≈ {formattedValue}
                            </span>
                          )}
                        </FormattedUsdTooltip>
                      </span>
                    ) : null}
                    {loading ? (
                      <Skeleton className="h-4 w-10" />
                    ) : (
                      <FormattedNumberTooltip
                        value={networkFee}
                        decimals={nativeTokenInfo?.decimals ?? 3}
                      >
                        {(formattedValue: string) => (
                          <span className="tabular-nums">{formattedValue}</span>
                        )}
                      </FormattedNumberTooltip>
                    )}

                    <FallbackImage
                      src={nativeTokenInfo?.icon}
                      fallbackSrc="/images/default-token.svg"
                      alt={nativeTokenInfo?.symbol ?? 'token icon'}
                      width={18}
                      height={18}
                    />
                  </div>
                ) : (
                  '-'
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="leading-[24px]">Cross-Chain Fee</span>
                {showValue ? (
                  <div className="flex items-center gap-[10px]">
                    {xcmTokenInfo?.priceId &&
                    prices?.[xcmTokenInfo?.priceId] ? (
                      <span className="hidden items-center whitespace-nowrap text-[#12161950] sm:flex">
                        <FormattedUsdTooltip
                          value={crossFee}
                          decimals={xcmTokenInfo?.decimals ?? 3}
                          displayDecimals={3}
                          price={prices?.[xcmTokenInfo?.priceId] ?? 0}
                        >
                          {(formattedValue: string) => (
                            <span className="tabular-nums">
                              ≈ {formattedValue}
                            </span>
                          )}
                        </FormattedUsdTooltip>
                      </span>
                    ) : null}
                    {loading ? (
                      <Skeleton className="h-4 w-10" />
                    ) : (
                      <FormattedNumberTooltip
                        value={crossFee}
                        decimals={xcmTokenInfo?.decimals ?? 3}
                      >
                        {(formattedValue: string) => (
                          <span className="tabular-nums">{formattedValue}</span>
                        )}
                      </FormattedNumberTooltip>
                    )}
                    <FallbackImage
                      src={xcmTokenInfo?.icon}
                      fallbackSrc="/images/default-token.svg"
                      alt={xcmTokenInfo?.symbol ?? 'token icon'}
                      width={18}
                      height={18}
                    />
                  </div>
                ) : (
                  '-'
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
