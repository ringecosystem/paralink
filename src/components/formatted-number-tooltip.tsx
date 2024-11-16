import React, { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { formatTokenAmount } from '@/utils/number';
import { cn } from '@/lib/utils';
import BN from 'bn.js';

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
  const formattedValue = formatTokenAmount({
    value,
    decimals,
    displayDecimals
  });
  const renderContent =
    children || ((formattedValue: string) => formattedValue);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div ref={ref} className={cn('cursor-pointer', className)}>
          {renderContent(formattedValue.formatted)}
        </div>
      </TooltipTrigger>
      <TooltipContent>{formattedValue.number}</TooltipContent>
    </Tooltip>
  );
});

FormattedNumberTooltip.displayName = 'FormattedNumberTooltip';

export default FormattedNumberTooltip;
