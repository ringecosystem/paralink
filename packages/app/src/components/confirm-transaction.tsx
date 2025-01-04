'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import FormattedUsdTooltip from './formatted-usd-tooltip';
import FormattedNumberTooltip from './formatted-number-tooltip';
import { FallbackImage } from './ui/fallback-image';
import BN from 'bn.js';
import { BN_ZERO, bnMax } from '@polkadot/util';
import type { Asset, ChainConfig } from '@/types/xcm-asset';
import { ConnectOrActionButton } from './connect-or-action-button';

interface ConfirmTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  showValue: boolean;
  amount: BN;
  networkFee: BN;
  crossFee: BN;
  nativeTokenInfo?: Asset;
  xcmTokenInfo?: Asset;
  sourceChain: ChainConfig;
  fromAddress: string;
  targetChain: ChainConfig;
  toAddress: string;
  isLoading?: boolean;
  onConfirm: () => void;
  prices?: Record<string, number>;
}

export function ConfirmTransaction({
  isOpen,
  onClose,
  showValue,
  amount,
  networkFee,
  crossFee,
  nativeTokenInfo,
  xcmTokenInfo,
  sourceChain,
  fromAddress,
  targetChain,
  toAddress,
  isLoading,
  onConfirm,
  prices
}: ConfirmTransactionProps) {
  const finalAmount = bnMax(amount.sub(crossFee), BN_ZERO);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-20px)] gap-0 rounded-[20px] p-[20px] md:w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[14px] font-bold text-[#121619]">
            Transaction Confirm
          </DialogTitle>
        </DialogHeader>
        <div className="my-[20px] h-[1px] w-full bg-[#12161910]"></div>

        <div className="flex w-full flex-col gap-[10px] rounded-[10px] bg-[#F2F3F5] p-[10px] text-[14px] font-normal">
          <div className="overflow-hidden">
            <div className="space-y-[10px]">
              <div className="flex items-center justify-between gap-[20px]">
                <span className="flex-shrink-0 leading-[24px]">
                  From On {sourceChain.name}
                </span>
                <div className="break-all text-right">{fromAddress}</div>
              </div>

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
                    <FormattedNumberTooltip
                      value={networkFee}
                      decimals={nativeTokenInfo?.decimals ?? 3}
                      displayDecimals={3}
                    >
                      {(formattedValue: string) => (
                        <span className="tabular-nums">{formattedValue}</span>
                      )}
                    </FormattedNumberTooltip>

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
                    <FormattedNumberTooltip
                      value={crossFee}
                      decimals={xcmTokenInfo?.decimals ?? 3}
                      displayDecimals={3}
                    >
                      {(formattedValue: string) => (
                        <span className="tabular-nums">{formattedValue}</span>
                      )}
                    </FormattedNumberTooltip>
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

              <div className="flex items-center justify-between">
                <span className="leading-[24px]">Receive (Estimated)</span>
                {showValue ? (
                  <div className="flex items-center gap-[10px]">
                    {xcmTokenInfo?.priceId &&
                    prices?.[xcmTokenInfo?.priceId] ? (
                      <span className="hidden text-[#12161950] sm:block">
                        <FormattedUsdTooltip
                          value={finalAmount}
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
                    <FormattedNumberTooltip
                      value={finalAmount}
                      decimals={xcmTokenInfo?.decimals ?? 3}
                      displayDecimals={3}
                    >
                      {(formattedValue: string) => (
                        <span className="tabular-nums">{formattedValue}</span>
                      )}
                    </FormattedNumberTooltip>
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

              <div className="flex items-center justify-between gap-[20px]">
                <span className="flex-shrink-0 leading-[24px]">
                  Receive Address on {targetChain.name}
                </span>
                <div className="break-all text-right">{toAddress}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-[20px] flex gap-4">
          <ConnectOrActionButton onAction={onConfirm} isLoading={isLoading}>
            Confirm Transaction
          </ConnectOrActionButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
