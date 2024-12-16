import {
  BN,
  BN_ZERO,
  bnToBn,
  formatBalance,
  formatDecimal
} from '@polkadot/util';

interface FormatBalanceOptions {
  decimals?: number;
  withZero?: boolean;
  symbol?: string;
  showFullPrecision?: boolean;
  displayDecimals?: number;
}

/**
 * Formats a token balance with customizable display options
 *
 * @param amount - The amount to format (BN, bigint, string, number, or null)
 * @param options - Formatting options
 * @param options.decimals - Number of decimal places in the token
 * @param options.withZero - Whether to display trailing zeros
 * @param options.symbol - Token symbol to append
 * @param options.showFullPrecision - Whether to show all decimal places
 * @param options.displayDecimals - Number of decimal places to display
 * @returns Formatted balance string
 *
 * @example
 * // Format 1000000000000 (1 DOT) with 12 decimals
 * formatTokenBalance(new BN('1000000000000'), {
 *   decimals: 12,
 *   symbol: 'DOT',
 *   displayDecimals: 2
 * }) // Returns "1.00 DOT"
 *
 * @example
 * // Format with full precision
 * formatTokenBalance(new BN('1234567890000'), {
 *   decimals: 12,
 *   symbol: 'DOT',
 *   showFullPrecision: true
 * }) // Returns "1.23456789 DOT"
 */
export function formatTokenBalance(
  amount: BN | bigint | string | number | null,
  options: FormatBalanceOptions
) {
  try {
    const {
      withZero = false,
      showFullPrecision = true,
      decimals,
      symbol,
      displayDecimals
    } = options;

    if (!amount || !decimals) return '-';

    let formattedAmount = formatBalance(bnToBn(amount), {
      withSi: symbol ? true : false,
      withZero,
      decimals,
      withUnit: symbol ? symbol : false,
      withAll: showFullPrecision ? true : false,
      forceUnit: '-'
    });

    if (displayDecimals !== undefined) {
      const [numberPart, ...rest] = formattedAmount.split(' ');
      const unit = rest.join(' ');
      const cleanNumber = numberPart.replace(/,/g, '');
      const [integerPart, decimalPart = ''] = cleanNumber.split('.');

      const formattedInteger = formatDecimal(integerPart);
      const formattedDecimal = decimalPart
        .padEnd(displayDecimals, '0')
        .slice(0, displayDecimals);
      const finalNumber =
        displayDecimals === 0
          ? formattedInteger
          : `${formattedInteger}.${formattedDecimal}`;
      formattedAmount = unit ? `${finalNumber} ${unit}` : finalNumber;
    }

    return formattedAmount;
  } catch {
    return '-';
  }
}

/**
 * Converts a decimal string to token units based on decimals
 *
 * @param params - Input parameters
 * @param params.value - The decimal string to convert
 * @param params.decimals - Number of decimal places in the token
 * @returns BN representing the amount in token units
 *
 * @example
 * // Convert "1.5" DOT to token units (12 decimals)
 * parseUnits({
 *   value: "1.5",
 *   decimals: 12
 * }) // Returns BN('1500000000000')
 *
 * @example
 * // Convert "100" USDC to token units (6 decimals)
 * parseUnits({
 *   value: "100",
 *   decimals: 6
 * }) // Returns BN('100000000')
 */
export function parseUnits({
  value,
  decimals
}: {
  value: string;
  decimals: number;
}): BN {
  try {
    if (decimals < 0) throw new Error('Decimals must be a positive number');

    if (!value || value === '.') return BN_ZERO;

    if (!/^-?\d*\.?\d*$/.test(value)) throw new Error('Invalid number format');

    const isNegative = value.startsWith('-');
    const absValue = isNegative ? value.slice(1) : value;

    const [integerPart = '0', decimalPart = ''] = absValue.split('.');

    const fullNumber =
      integerPart + decimalPart.padEnd(decimals, '0').slice(0, decimals);

    let result = new BN(fullNumber);
    if (isNegative) result = result.neg();

    return result;
  } catch (e) {
    console.error('parseUnits error:', e);
    return BN_ZERO;
  }
}
