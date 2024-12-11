'use client';

import { useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { BN, BN_ZERO, bnToBn } from '@polkadot/util';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FallbackImage } from '@/components/ui/fallback-image';
import FormattedNumberTooltip from '@/components/formatted-number-tooltip';
import { useNumberInput } from '@/hooks/number-input';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { parseUnits } from '@/utils/format';
import { useTokenBalances } from './_hooks/use-token-balances';
import { getAcceptablePaymentTokens } from '@/services/xcm/get-acceptable-payment-token';
import { checkAssetHubAcceptablePaymentToken } from '@/services/xcm/check-assethub-acceptable-payment-token';
import { AssetPickerLoading } from './loading';
import { BalanceWithSymbol, AssetPickerList } from './list';
import useTokensStore from '@/store/tokens';
import { useShallow } from 'zustand/react/shallow';
import { useMinBalance } from '../../_hooks/use-min-balance';
import { Skeleton } from '@/components/ui/skeleton';
import useApiConnectionsStore from '@/store/api-connections';
import { isXcmLocationMatch } from '@/utils/xcm/helper';
import type { Asset } from '@/types/registry';

export interface PickerProps {
  ref: React.RefObject<{ refreshBalances: () => void }>;
  tokens?: Asset[];
  tokenBalance?: BalanceWithSymbol;
  tokenBalances?: BalanceWithSymbol[];
  sourceChainId?: number;
  targetChainId?: number;
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
  tokens,
  sourceChainId,
  targetChainId,
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

  const getValidApi = useApiConnectionsStore((state) => state.getValidApi);

  const { selectedToken, setSelectedToken } = useTokensStore(
    useShallow((state) => ({
      selectedToken: state.selectedToken,
      setSelectedToken: state.setSelectedToken
    }))
  );

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

  const price = undefined;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { value, handleChange, handleBlur, handleReset } = useNumberInput({
    maxDecimals: selectedToken?.decimals ?? 18,
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
    (token: Asset) => {
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
      if (!tokens?.length || !targetChainId) return;
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
          const acceptablePaymentTokens = await getAcceptablePaymentTokens({
            api: targetChainApi
          });
          console.log('acceptablePaymentTokens', acceptablePaymentTokens);
          console.log('tokens', tokens);

          if (acceptablePaymentTokens?.length) {
            const matchTokens = tokens.filter((asset) => {
              const isSupported = acceptablePaymentTokens.some((tokenInfo) =>
                isXcmLocationMatch({
                  acceptablePaymentLocation: tokenInfo?.v3?.concrete,
                  asset
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
  }, [tokens, setSelectedToken, sourceChainId, getValidApi, targetChainId]);

  useEffect(() => {
    let isInvalid = false;
    if (!value || value === '0') {
      return;
    }
    const valueBN = parseUnits({
      value: value,
      decimals: selectedToken?.decimals ?? 18
    });
    if (valueBN.gt(maxBalanceBN) || valueBN.lt(minBalanceBN)) {
      isInvalid = true;
    }
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
  // focus-within:shadow-lg

  return (
    <>
      <div>
        <div
          className={cn(
            'flex items-center gap-[10px] rounded-[10px] bg-[#F2F3F5] p-[10px]'
          )}
        >
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
                  value && 'text-[#121619]',
                  isInvalid && 'text-[#ff2d20]'
                )}
                placeholder="0.000"
                type="number"
                value={value}
                disabled={isMinBalanceLoading}
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
          <div className="flex items-center gap-2 px-2 text-xs text-gray-500">
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
            {<span>•</span>}
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
