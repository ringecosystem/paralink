import React, { ReactNode, useCallback } from 'react';
import BN from 'bn.js';
import { useCopyToClipboard } from 'react-use';
import { toast } from 'react-hot-toast';
import BigNumber from 'bignumber.js';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatUnits } from 'viem';

interface FormattedUsdTooltipProps {
  value: BN;
  decimals: number;
  price: number;
  displayDecimals?: number;
  className?: string;
  children?: (formattedUsdValue: string) => ReactNode;
}

const FormattedUsdTooltip = React.forwardRef<
  HTMLDivElement,
  FormattedUsdTooltipProps
>(
  (
    { value, decimals, price, displayDecimals = 2, className, children },
    ref
  ) => {
    const [, copyToClipboard] = useCopyToClipboard();

    const calculateUsdValue = useCallback(
      (tokenAmount: BN): string => {
        try {
          const result = formatUnits(BigInt(tokenAmount?.toString()), decimals);

          console.log('calculateUsdValue', result);

          const resultBig = new BigNumber(result);
          return resultBig.times(price)?.toString();
        } catch (error) {
          console.error('Error calculating USD value', error);
          return '0';
        }
      },
      [price, decimals]
    );

    const formatUsdValue = useCallback(
      (value: string, fullPrecision = false): string => {
        return Number(value).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: fullPrecision ? 6 : displayDecimals,
          maximumFractionDigits: fullPrecision ? 6 : displayDecimals
        });
      },
      [displayDecimals]
    );

    const usdValue = calculateUsdValue(value);
    const formattedUsdValue = formatUsdValue(usdValue, false);
    const formattedUsdValueFull = formatUsdValue(usdValue, true);

    const handleCopy = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        copyToClipboard(usdValue);
        toast.success('Copied USD value to clipboard');
      },
      [copyToClipboard, usdValue]
    );

    const renderContent =
      children || ((formattedValue: string) => formattedValue);

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div ref={ref} className={cn('cursor-pointer', className)}>
            {renderContent(formattedUsdValue)}
          </div>
        </TooltipTrigger>
        <TooltipContent onClick={handleCopy} className="cursor-pointer">
          {formattedUsdValueFull}
        </TooltipContent>
      </Tooltip>
    );
  }
);

FormattedUsdTooltip.displayName = 'FormattedUsdTooltip';

export default FormattedUsdTooltip;
