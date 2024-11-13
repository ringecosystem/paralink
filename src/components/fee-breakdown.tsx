'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface FeeBreakdownProps {
  amount: number;
  networkFee: number;
  crossChainFee: number;
  finalAmount: number;
}

export function FeeBreakdown({
  amount,
  networkFee,
  crossChainFee,
  finalAmount
}: FeeBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
          You Will Receive (Estimated)
        </span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-mono text-[14px] font-bold tabular-nums text-[#12161950]',
              isExpanded && 'text-[#242A2E]'
            )}
          >
            {amount?.toFixed(2)}
          </span>
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
            initial={{ height: 0, opacity: 0 }}
            animate={{
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
            }}
            exit={{
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
            }}
            className="overflow-hidden"
          >
            <div className="space-y-[10px]">
              <div className="flex items-center justify-between">
                <span className="leading-[24px]">Network Fee</span>
                <div className="flex items-center gap-[10px]">
                  <span className="hidden text-[#12161950] sm:block">
                    ≈ $
                    <span className="font-mono tabular-nums">
                      {networkFee?.toFixed(2)}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums">
                    {networkFee?.toFixed(3)}
                  </span>
                  <Image
                    src="/images/test3.svg"
                    alt="info"
                    width={18}
                    height={18}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="leading-[24px]">Cross-Chain Fee</span>
                <div className="flex items-center gap-[10px]">
                  <span className="hidden text-[#12161950] sm:block">
                    ≈ $
                    <span className="font-mono tabular-nums">
                      {crossChainFee?.toFixed(3)}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums">
                    {crossChainFee?.toFixed(3)}
                  </span>
                  <Image
                    src="/images/test3.svg"
                    alt="info"
                    width={18}
                    height={18}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="leading-[24px]">
                  You Will Receive (Estimated)
                </span>
                <div className="flex items-center gap-[10px]">
                  <span className="hidden text-[#12161950] sm:block">
                    ≈ $
                    <span className="font-mono tabular-nums">
                      {finalAmount?.toFixed(2)}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums">
                    {finalAmount?.toFixed(3)}
                  </span>
                  <Image
                    src="/images/test3.svg"
                    alt="info"
                    width={18}
                    height={18}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
