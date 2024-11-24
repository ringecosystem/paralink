import BN from 'bn.js';

interface FormatNumberResult {
  number: number;
  formatted: string;
  raw: string;
}

/**
 * Format BN to actual value and formatted string
 * @param value - BN object
 * @param decimals - Token decimal places
 * @param displayDecimals - Number of decimal places to display (default 3)
 */
export function formatTokenAmount({
  value,
  decimals,
  displayDecimals = 3
}: {
  value: BN;
  decimals: number;
  displayDecimals?: number;
}): FormatNumberResult {
  if (!value) return { number: 0, formatted: '0', raw: '0' };

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
  const raw = realNumber.toFixed(decimals);

  return {
    number: realNumber,
    raw,
    formatted
  };
}

/**
 * Format string amount to actual value and formatted string
 * @param value - String amount (e.g. "1234567890")
 * @param decimals - Token decimal places
 * @param displayDecimals - Number of decimal places to display (default 3)
 */
export function formatStringTokenAmount({
  value,
  decimals,
  displayDecimals = 3
}: {
  value: string;
  decimals: number;
  displayDecimals?: number;
}): FormatNumberResult {
  if (!value || value === '0') return { number: 0, formatted: '0', raw: '0' };

  // Remove any commas and validate
  const cleanValue = value.replace(/,/g, '').trim();
  if (!/^\d*\.?\d+$/.test(cleanValue))
    return { number: 0, formatted: '0', raw: '0' };

  try {
    const [integerPart, decimalPart = ''] = cleanValue.split('.');
    const paddedDecimal = decimalPart.padEnd(decimals, '0');
    const fullNumber = integerPart + paddedDecimal;

    const bnValue = new BN(fullNumber);
    return formatTokenAmount({ value: bnValue, decimals, displayDecimals });
  } catch {
    return { number: 0, formatted: '0', raw: '0' };
  }
}

/**
 * Converts a string containing commas into a number.
 * @param numberStr - The string representing a number with commas (e.g., "76,478,242,000")
 * @returns The converted number. Throws an error if the input is invalid.
 */
export function removeCommasAndConvertToNumber(numberStr: string): number {
  if (typeof numberStr !== 'string') {
    throw new TypeError('Input must be a string.');
  }

  // Trim whitespace and check for empty string
  const trimmedStr = numberStr.trim();
  if (trimmedStr === '') {
    return 0;
  }

  // Validate the format of the string
  // The regex allows numbers with or without commas, and optional decimal points
  const validFormat = /^-?(\d+|\d{1,3}(,\d{3})+)(\.\d+)?$/;
  if (!validFormat.test(trimmedStr)) {
    return 0;
  }

  // Remove all commas
  const numberWithoutCommas = trimmedStr.replace(/,/g, '');

  // Convert to number and verify
  const result = Number(numberWithoutCommas);
  if (isNaN(result)) {
    throw new Error('Cannot convert input to a number.');
  }

  return result;
}
