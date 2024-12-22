import React, { ReactNode, useCallback } from 'react';
import BN from 'bn.js';
import { useCopyToClipboard } from 'react-use';
import { toast } from 'react-hot-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatTokenBalance } from '@/utils/format';

interface FormattedNumberTooltipProps {
  value: BN;
  decimals: number;
  displayDecimals?: number;
  className?: string;
  children?: (formattedValue: string) => ReactNode;
}

const FormattedNumberTooltip = React.forwardRef<
  HTMLDivElement,
  FormattedNumberTooltipProps
>(({ value, decimals, displayDecimals = 3, className, children }, ref) => {
  const [, copyToClipboard] = useCopyToClipboard();

  const handleCopy = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (!value) return;
      const text = formatTokenBalance(value, {
        decimals,
        showFullPrecision: true,
        withZero: true
      });
      copyToClipboard(text);

      toast.success('Copied to clipboard');
    },
    [copyToClipboard, value, decimals]
  );

  const formattedBalance = formatTokenBalance(value, {
    decimals,
    showFullPrecision: false,
    displayDecimals
  });

  const formattedValueWithFullPrecision = formatTokenBalance(value, {
    decimals,
    showFullPrecision: true,
    withZero: true
  });

  const renderContent =
    children || ((formattedValue: string) => formattedValue);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div ref={ref} className={cn('cursor-pointer', className)}>
          {renderContent(formattedBalance)}
        </div>
      </TooltipTrigger>
      <TooltipContent onClick={handleCopy} className="cursor-pointer">
        {formattedValueWithFullPrecision}
      </TooltipContent>
    </Tooltip>
  );
});

FormattedNumberTooltip.displayName = 'FormattedNumberTooltip';

export default FormattedNumberTooltip;
