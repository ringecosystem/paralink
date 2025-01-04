'use client';

import { useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { BN, BN_ZERO, bnToBn } from '@polkadot/util';
import { ChevronDown } from 'lucide-react';
import { isNil } from 'lodash-es';
import { cn } from '@/lib/utils';
import { FallbackImage } from '@/components/ui/fallback-image';
import { Button } from '@/components/ui/button';
import FormattedNumberTooltip from '@/components/formatted-number-tooltip';
import { useNumberInput } from '@/hooks/number-input';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { formatTokenBalance, parseUnits } from '@/utils/format';
import { useTokenBalances } from './_hooks/use-token-balances';
import { XcmV3MultiLocation } from '@/services/xcm/get-acceptable-payment-token';
import { checkAssetHubAcceptablePaymentToken } from '@/services/xcm/check-assethub-acceptable-payment-token';
import { AssetPickerLoading } from './loading';
import { BalanceWithSymbol, AssetPickerList } from './list';
import useTokensStore from '@/store/tokens';
import { useShallow } from 'zustand/react/shallow';
import { useMinBalance } from '../../_hooks/use-min-balance';
import { Skeleton } from '@/components/ui/skeleton';
import useApiConnectionsStore from '@/store/api-connections';
import { isXcmLocationMatch } from '@/utils/xcm/helper';
import type { Asset } from '@/types/xcm-asset';
import FormattedUsdTooltip from '@/components/formatted-usd-tooltip';

export interface PickerProps {
  ref: React.RefObject<{ refreshBalances: () => void }>;
  tokens?: Asset[];
  prices?: Record<string, number>;
  tokenBalance?: BalanceWithSymbol;
  tokenBalances?: BalanceWithSymbol[];
  sourceChainId?: number;
  targetChainId?: number;
  acceptablePaymentTokens?: XcmV3MultiLocation[];
  crossFee: BN;
  isCrossFeeLoading: boolean;
  maxBalanceBN: BN;
  isMaxBalanceLoading: boolean;
  error?: React.ReactNode;
  onChangeToken?: (token: Asset | undefined) => void;
  onChangeAmount?: (value: string) => void;
  onChangeTokenBalance?: (value: BN) => void;
  onChangeInvalid?: (value: boolean) => void;
}

export function Picker({
  ref,
  prices,
  tokens,
  sourceChainId,
  targetChainId,
  acceptablePaymentTokens,
  crossFee,
  isCrossFeeLoading,
  maxBalanceBN,
  isMaxBalanceLoading,
  error,
  onChangeAmount,
  onChangeTokenBalance,
  onChangeInvalid
}: PickerProps) {
  const { address } = useWalletConnection();
  const [availableTokens, setAvailableTokens] = useState<Asset[]>([]);
  const [availableTokensLoading, setAvailableTokensLoading] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLessThanMinBalance, setIsLessThanMinBalance] = useState(false);
  const [isMoreThanMaxBalance, setIsMoreThanMaxBalance] = useState(false);

  const getValidApi = useApiConnectionsStore((state) => state.getValidApi);

  const { selectedToken, setSelectedToken } = useTokensStore(
    useShallow((state) => ({
      selectedToken: state.selectedToken,
      setSelectedToken: state.setSelectedToken
    }))
  );
  useEffect(() => {
    console.log('selectedToken', selectedToken);
  }, [selectedToken]);

  const {
    data: updatedBalances,
    isLoading: isBalancesLoading,
    refresh: refreshBalances
  } = useTokenBalances({
    address,
    tokens: availableTokens,
    paraId: sourceChainId
  });

  const tokenBalance = updatedBalances?.find(
    (balance) => balance.symbol === selectedToken?.symbol
  );

  const { balance: minBalance, isLoading: isMinBalanceLoading } = useMinBalance(
    {
      chainId: targetChainId,
      asset: selectedToken,
      decimals: selectedToken?.decimals
    }
  );

  const minBalanceBN = bnToBn(minBalance).add(crossFee);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { value, handleChange, handleBlur, handleReset, handleChangeValue } =
    useNumberInput({
      maxDecimals: selectedToken?.decimals ?? 18,
      initialValue: '',
      onChange: onChangeAmount
    });

  const handleOpenDialog = useCallback(() => {
    if (!availableTokens?.length) {
      return;
    }
    setIsDialogOpen(true);
  }, [availableTokens]);

  const handleSelect = useCallback(
    (token: Asset) => {
      setSelectedToken(token);
      setIsDialogOpen(false);
      handleReset();
    },
    [setSelectedToken, handleReset]
  );

  const handleMax = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const formattedBalance = formatTokenBalance(maxBalanceBN, {
        decimals: selectedToken?.decimals ?? 18,
        showFullPrecision: true,
        withZero: true
      });

      handleChangeValue(formattedBalance);
    },
    [maxBalanceBN, handleChangeValue, selectedToken?.decimals]
  );

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  // update selected token balance
  useEffect(() => {
    if (tokenBalance?.balance) {
      onChangeTokenBalance?.(tokenBalance.balance);
    } else {
      onChangeTokenBalance?.(BN_ZERO);
    }
  }, [tokenBalance, onChangeTokenBalance]);

  // get available tokens
  useEffect(() => {
    const initTokens = async () => {
      if (!tokens?.length || isNil(targetChainId)) return;
      setAvailableTokensLoading(true);
      const targetChainApi = await getValidApi(targetChainId);

      try {
        if (targetChainId === 1000) {
          const tokenPromises = tokens.map((token) =>
            checkAssetHubAcceptablePaymentToken({
              api: targetChainApi,
              asset: token
            })
          );
          const results = await Promise.allSettled(tokenPromises);
          const validTokens = tokens.filter((_, index) => {
            const result = results[index];
            return result.status === 'fulfilled' && result.value === true;
          });

          if (validTokens?.length) {
            setAvailableTokens(validTokens ?? []);
            setSelectedToken(validTokens[0]);
          }
        } else {
          if (acceptablePaymentTokens?.length) {
            const matchTokens = tokens.filter((asset) => {
              const isSupported = acceptablePaymentTokens.some((tokenInfo) =>
                isXcmLocationMatch({
                  acceptablePaymentLocation: tokenInfo?.v3?.concrete,
                  asset,
                  targetChainId
                })
              );
              return isSupported;
            });
            console.log(
              'Matched tokens:',
              matchTokens.map((t) => t.symbol)
            );
            if (matchTokens?.length) {
              setAvailableTokens(matchTokens ?? []);
              setSelectedToken(matchTokens[0]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize tokens:', error);
      } finally {
        setAvailableTokensLoading(false);
      }
    };
    initTokens();
  }, [
    tokens,
    setSelectedToken,
    sourceChainId,
    getValidApi,
    targetChainId,
    acceptablePaymentTokens
  ]);

  useEffect(() => {
    let isInvalid = false;
    if (!value || value === '0') {
      setIsLessThanMinBalance(false);
      setIsMoreThanMaxBalance(false);
      setIsInvalid(false);
      onChangeInvalid?.(false);
      return;
    }

    const valueBN = parseUnits({
      value: value,
      decimals: selectedToken?.decimals ?? 18
    });

    // Always set these states based on current conditions
    const isLessThanMin = valueBN.lt(minBalanceBN);
    const isMoreThanMax = valueBN.gt(maxBalanceBN);

    setIsLessThanMinBalance(isLessThanMin);
    setIsMoreThanMaxBalance(isMoreThanMax);

    isInvalid = isLessThanMin || isMoreThanMax;
    setIsInvalid(isInvalid);
    onChangeInvalid?.(isInvalid);
  }, [
    value,
    selectedToken?.decimals,
    minBalanceBN,
    maxBalanceBN,
    onChangeInvalid
  ]);

  // clean up state
  useEffect(() => {
    return () => {
      setIsInvalid(false);
      setSelectedToken(undefined);
      setAvailableTokens([]);
      setAvailableTokensLoading(false);
      setIsLessThanMinBalance(false);
      setIsMoreThanMaxBalance(false);
      handleReset();
    };
  }, [setSelectedToken, handleReset]);

  useImperativeHandle(
    ref,
    () => ({
      refreshBalances
    }),
    [refreshBalances]
  );
  if (availableTokensLoading) {
    return <AssetPickerLoading />;
  }
  if (!availableTokens?.length) {
    return (
      <div className="rounded-[10px] bg-[#c6c6c6] p-[20px] text-center text-[16px] font-normal leading-normal text-white">
        No Tokens Available
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="rounded-[10px] bg-[#F2F3F5] p-[10px]">
          <div className={cn('flex items-center gap-[10px]')}>
            <div className="relative h-[40px] w-[40px] flex-shrink-0">
              <FallbackImage
                src={selectedToken?.icon ?? '/images/default-token.svg'}
                fallbackSrc="/images/default-token.svg"
                alt={selectedToken?.symbol ?? 'no icon'}
                fill
              />
            </div>

            <div className="grid w-full grid-cols-[2fr_3fr] items-center gap-[10px]">
              <div
                className={cn(
                  'flex cursor-pointer flex-col items-start transition-opacity hover:opacity-80',
                  !tokens?.length && 'pointer-events-none opacity-50'
                )}
                onClick={handleOpenDialog}
              >
                <div className="flex items-center gap-[5px] leading-normal">
                  <span className="text-[18px] font-bold">
                    {selectedToken?.symbol || ''}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </div>
                <span className="flex items-center text-[12px] font-normal leading-normal text-[#12161950]">
                  Balance:
                  {isBalancesLoading ? (
                    <Skeleton className="h-4 w-10" />
                  ) : typeof tokenBalance?.balance !== 'undefined' ? (
                    <div className="flex items-center gap-1">
                      <FormattedNumberTooltip
                        value={tokenBalance?.balance}
                        decimals={selectedToken?.decimals ?? 0}
                      />
                      <Button
                        size="sm"
                        className="h-auto rounded-sm px-2 py-[2px] text-[10px]"
                        variant="outline"
                        onClick={handleMax}
                      >
                        MAX
                      </Button>
                    </div>
                  ) : (
                    <span className="tabular-nums">-</span>
                  )}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <input
                  className={cn(
                    'w-full bg-transparent text-right text-[18px] font-bold tabular-nums text-[#12161950] focus-visible:outline-none',
                    'md:text-[24px]',
                    value && 'text-[#121619]',
                    isInvalid && 'text-[#FF2D20]'
                  )}
                  placeholder="0.000"
                  type="number"
                  value={value}
                  disabled={isMinBalanceLoading}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <span className="flex items-center text-[12px] font-normal leading-normal text-[#12161950]">
                  ≈ 
                  {selectedToken?.priceId &&
                  prices?.[selectedToken?.priceId] ? (
                    <FormattedUsdTooltip
                      price={prices?.[selectedToken?.priceId ?? ''] ?? 0}
                      value={
                        value !== ''
                          ? bnToBn(
                              parseUnits({
                                value: value,
                                decimals: selectedToken?.decimals ?? 0
                              })
                            )
                          : BN_ZERO
                      }
                      decimals={selectedToken?.decimals ?? 0}
                    />
                  ) : (
                    <span className="tabular-nums">0.000</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {(isLessThanMinBalance || isMoreThanMaxBalance) && (
            <div className="mt-[10px] flex items-center justify-end gap-2 text-xs text-[#FF2D20]">
              {isLessThanMinBalance && (
                <div className="flex items-center gap-1">
                  Min:{' '}
                  {isMinBalanceLoading || isCrossFeeLoading ? (
                    <Skeleton className="h-4 w-10" />
                  ) : (
                    <FormattedNumberTooltip
                      value={minBalanceBN ?? BN_ZERO}
                      decimals={selectedToken?.decimals ?? 0}
                      displayDecimals={3}
                    />
                  )}
                </div>
              )}
              {isMoreThanMaxBalance && (
                <div className="flex items-center gap-1">
                  Max:{' '}
                  {isMaxBalanceLoading ? (
                    <Skeleton className="h-4 w-10" />
                  ) : (
                    <FormattedNumberTooltip
                      value={maxBalanceBN ?? BN_ZERO}
                      decimals={selectedToken?.decimals ?? 0}
                      displayDecimals={3}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-left">{error}</div>
      </div>

      <AssetPickerList
        isOpen={isDialogOpen}
        isLoading={isBalancesLoading}
        tokenBalances={updatedBalances}
        onClose={handleCloseDialog}
        onSelect={handleSelect}
        tokens={availableTokens || []}
      />
    </>
  );
}
