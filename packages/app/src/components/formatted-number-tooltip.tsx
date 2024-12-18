import React, { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import BN from 'bn.js';
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
      <TooltipContent>{formattedValueWithFullPrecision}</TooltipContent>
    </Tooltip>
  );
});

FormattedNumberTooltip.displayName = 'FormattedNumberTooltip';

export default FormattedNumberTooltip;
