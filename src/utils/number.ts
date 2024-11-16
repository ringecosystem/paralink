import BN from 'bn.js';

interface FormatNumberResult {
  number: number;
  formatted: string;
}

/**
 * Format BN to actual value and formatted string
 * @param value - BN object
 * @param decimals - Token decimal places
 * @param displayDecimals - Number of decimal places to display (default 3)
 */
function formatTokenAmount({
  value,
  decimals,
  displayDecimals = 3
}: {
  value: BN;
  decimals: number;
  displayDecimals?: number;
}): FormatNumberResult {
  if (!value) return { number: 0, formatted: '0' };

  // Create divisor (10 ** decimals)
  const base = new BN(10).pow(new BN(decimals));

  // Get integer part and remainder
  const integer = value.div(base);
  const fraction = value.mod(base);

  // Convert fraction part
  const fractionStr = fraction.toString().padStart(decimals, '0');
  const realNumber = Number(`${integer.toString()}.${fractionStr}`);

  // Format to specified decimal places
  const formatted = realNumber.toFixed(displayDecimals);

  return {
    number: realNumber,
    formatted
  };
}

export { formatTokenAmount };
