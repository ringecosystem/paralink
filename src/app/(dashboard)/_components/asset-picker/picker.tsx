'use client';

import { useCallback, useEffect, useState } from 'react';
import { BN, BN_ZERO, bnToBn } from '@polkadot/util';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FallbackImage } from '@/components/ui/fallback-image';
import FormattedNumberTooltip from '@/components/formatted-number-tooltip';
import { useNumberInput } from '@/hooks/number-input';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { formatTokenBalance } from '@/utils/format';
import { isXcmLocationMatch } from '@/utils/xcm';
import { useTokenBalances } from './_hooks/use-token-balances';
import { getAcceptablePaymentTokens } from '@/services/xcm/get-acceptable-payment-token';
import { checkAssetHubAcceptablePaymentToken } from '@/services/xcm/check-assethub-acceptable-payment-token';
import { AssetPickerLoading } from './loading';
import { BalanceWithSymbol, AssetPickerList } from './list';
import useTokensStore from '@/store/tokens';
import { useShallow } from 'zustand/react/shallow';
import { useMinBalance } from '../../_hooks/use-min-balance';
import { Skeleton } from '@/components/ui/skeleton';
import type { ApiPromise } from '@polkadot/api';
import type { AvailableToken } from '@/utils/xcm-token';

export interface PickerProps {
  tokens?: AvailableToken[];
  tokenBalance?: BalanceWithSymbol;
  tokenBalances?: BalanceWithSymbol[];
  sourceChainId?: string;
  targetChainId?: string;
  sourceChainApi?: ApiPromise | null;
  targetChainApi?: ApiPromise | null;
  crossFee: BN;
  isCrossFeeLoading: boolean;
  maxBalance?: BN;
  isMaxBalanceLoading: boolean;
  error?: React.ReactNode;
  onChangeToken?: (token: AvailableToken | undefined) => void;
  onChangeAmount?: (value: string) => void;
  onChangeTokenBalance?: (value: BN) => void;
}

export function Picker({
  tokens,
  sourceChainId,
  targetChainId,
  sourceChainApi,
  targetChainApi,
  crossFee,
  isCrossFeeLoading,
  maxBalance,
  isMaxBalanceLoading,
  error,
  onChangeAmount,
  onChangeTokenBalance
}: PickerProps) {
  const { address } = useWalletConnection();
  const [availableTokens, setAvailableTokens] = useState<AvailableToken[]>([]);
  const [availableTokensLoading, setAvailableTokensLoading] = useState(false);

  const { selectedToken, setSelectedToken } = useTokensStore(
    useShallow((state) => ({
      selectedToken: state.selectedToken,
      setSelectedToken: state.setSelectedToken
    }))
  );

  const { data: updatedBalances, isLoading: isBalancesLoading } =
    useTokenBalances({
      address,
      tokens: availableTokens,
      paraId: sourceChainId,
      api: sourceChainApi
    });

  const tokenBalance = updatedBalances?.find(
    (balance) => balance.symbol === selectedToken?.symbol
  );

  const { balance: minBalance, isLoading: isMinBalanceLoading } = useMinBalance(
    {
      api: targetChainApi,
      asset: selectedToken?.xcAssetData,
      decimals: selectedToken?.decimals
    }
  );

  const minBalanceBN = bnToBn(minBalance).add(crossFee);

  // const min = minBalance ? minBalance.toNumber() : 0;
  // const max = maxBalance ? maxBalance.toNumber() : 0;

  const price = undefined;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { value, handleChange, handleBlur, handleReset } = useNumberInput({
    maxDecimals: selectedToken?.decimals ?? 18,
    // minValue: min,
    initialValue: '',
    onChange: onChangeAmount
  });

  function handleOpenDialog() {
    if (!availableTokens?.length) {
      return;
    }
    setIsDialogOpen(true);
  }

  const handleSelect = useCallback(
    (token: AvailableToken) => {
      setSelectedToken(token);
      setIsDialogOpen(false);
      handleReset();
    },
    [setSelectedToken, handleReset]
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
      if (!tokens?.length || !targetChainApi || !targetChainId) return;
      setAvailableTokensLoading(true);
      try {
        if (targetChainId === '1000') {
          const tokenPromises = tokens.map((token) =>
            checkAssetHubAcceptablePaymentToken({
              api: targetChainApi,
              asset: token.xcAssetData
            })
          );
          const results = await Promise.allSettled(tokenPromises);
          const validTokens = tokens.filter((_, index) => {
            const result = results[index];
            return result.status === 'fulfilled' && result.value === true;
          });
          console.log(
            'all tokens:',
            tokens.map((t) => t.symbol)
          );
          console.log(
            'Matched tokens:',
            validTokens.map((t) => t.symbol)
          );
          if (validTokens?.length) {
            setAvailableTokens(validTokens ?? []);
            setSelectedToken(validTokens[0]);
          }
        } else {
          const acceptablePaymentTokens = await getAcceptablePaymentTokens({
            api: targetChainApi
          });
          if (acceptablePaymentTokens?.length) {
            const matchTokens = tokens.filter((asset) => {
              const isSupported = acceptablePaymentTokens.some((tokenInfo) =>
                isXcmLocationMatch(
                  Number(sourceChainId),
                  tokenInfo?.v3?.concrete,
                  JSON.parse(asset?.xcAssetData?.xcmV1MultiLocation)?.v1
                )
              );

              if (!isSupported) {
                console.log('Unsupported token:', {
                  symbol: asset.symbol,
                  xcmLocation: JSON.parse(
                    asset?.xcAssetData?.xcmV1MultiLocation
                  )?.v1
                });
              }

              return isSupported;
            });
            console.log(
              'all tokens:',
              tokens.map((t) => t.symbol)
            );
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
  }, [tokens, setSelectedToken, sourceChainId, targetChainApi, targetChainId]);

  // clean up state
  useEffect(() => {
    return () => {
      setSelectedToken(undefined);
      setAvailableTokens([]);
      setAvailableTokensLoading(false);
      handleReset();
    };
  }, [setSelectedToken, handleReset]);

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
        <div className="flex items-center gap-[10px] rounded-[10px] bg-[#F2F3F5] p-[10px]">
          <div className="relative h-[40px] w-[40px] flex-shrink-0">
            <FallbackImage
              src={selectedToken?.icon ?? '/images/default-token.svg'}
              fallbackSrc="/images/default-token.svg"
              alt={selectedToken?.symbol ?? 'no icon'}
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
                  {selectedToken?.symbol || ''}
                </span>
                <ChevronDown className="h-4 w-4" />
              </div>
              <span className="flex items-center text-[12px] font-normal leading-normal text-[#12161950]">
                Balance:
                {isBalancesLoading ? (
                  <Skeleton className="h-4 w-10" />
                ) : typeof tokenBalance?.balance !== 'undefined' ? (
                  <FormattedNumberTooltip
                    value={tokenBalance?.balance}
                    decimals={selectedToken?.decimals ?? 0}
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
                disabled={
                  isMinBalanceLoading ||
                  isCrossFeeLoading ||
                  isMaxBalanceLoading
                }
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <span className="flex items-center text-[12px] font-normal leading-normal text-[#12161950]">
                ≈ ${' '}
                {price ? (
                  <FormattedNumberTooltip
                    // value={token.price ?? BN_ZERO}
                    value={BN_ZERO}
                    decimals={selectedToken?.decimals ?? 0}
                  />
                ) : (
                  <span className="font-mono tabular-nums">0.000</span>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <div className="text-left">{error}</div>
          <div className="flex items-center justify-end gap-2 px-2 text-[11px] text-[#242A2E]">
            <div className="flex items-center gap-1">
              Min:{' '}
              {isMinBalanceLoading || isCrossFeeLoading ? (
                <Skeleton className="h-4 w-10" />
              ) : (
                formatTokenBalance(minBalance ?? BN_ZERO, {
                  decimals: selectedToken?.decimals,
                  symbol: selectedToken?.symbol
                })
              )}
            </div>
            {<span>•</span>}
            <div className="flex items-center gap-1">
              Max:{' '}
              {isMaxBalanceLoading ? (
                <Skeleton className="h-4 w-10" />
              ) : (
                formatTokenBalance(maxBalance ?? BN_ZERO, {
                  decimals: selectedToken?.decimals,
                  symbol: selectedToken?.symbol
                })
              )}
            </div>
          </div>
        </div>
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
