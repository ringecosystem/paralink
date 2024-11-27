import { bnToBn } from '@polkadot/util';
import type { BN } from '@polkadot/util';

/**
 * Converts a string containing commas into a string.
 *
 * @param numberStr - The string representing a number with commas
 * @returns The converted number. Returns 0 if the input is invalid.
 *
 * @example
 * ```ts
 * removeCommasAndConvertToString("1,234,567.89") // returns "1234567.89"
 * removeCommasAndConvertToString("1234567.89")   // returns "1234567.89"
 * removeCommasAndConvertToString("")             // returns "0"
 * removeCommasAndConvertToString("invalid")      // returns "0"
 * ```
 */
export function removeCommasAndConvertToString(numberStr: string): string {
  if (typeof numberStr !== 'string') {
    return '0';
  }

  // Trim whitespace and check for empty string
  const trimmedStr = numberStr.trim();
  if (trimmedStr === '') {
    return '0';
  }

  // Validate the format of the string
  // The regex allows numbers with or without commas, and optional decimal points
  const validFormat = /^-?(\d+|\d{1,3}(,\d{3})+)(\.\d+)?$/;
  if (!validFormat.test(trimmedStr)) {
    return '0';
  }

  // Remove all commas
  const numberWithoutCommas = trimmedStr.replace(/,/g, '');

  // Convert to number and verify
  const result = Number(numberWithoutCommas);
  return isNaN(result) ? '0' : result.toString();
}

/**
 * Converts a string containing commas into a number.
 *
 * @param numberStr - The string representing a number with commas
 * @returns The converted number. Returns 0 if the input is invalid.
 *
 * @example
 * ```ts
 * removeCommasAndConvertToNumber("1,234,567.89") // returns 1234567.89
 * removeCommasAndConvertToNumber("1234567.89")   // returns 1234567.89
 * removeCommasAndConvertToNumber("")             // returns 0
 * removeCommasAndConvertToNumber("invalid")      // returns 0
 * ```
 */
export function removeCommasAndConvertToNumber(numberStr: string): number {
  return Number(removeCommasAndConvertToString(numberStr));
}

/**
 * Converts a string containing commas into a BN (Big Number) instance.
 * Useful for blockchain calculations where precision is critical.
 *
 * @param numberStr - The string representing a number with commas
 * @returns A BN instance of the converted number. Returns BN(0) if the input is invalid.
 *
 * @example
 * ```ts
 * removeCommasAndConvertToBN("1,234,567")    // returns BN(1234567)
 * removeCommasAndConvertToBN("1234567")      // returns BN(1234567)
 * removeCommasAndConvertToBN("")             // returns BN(0)
 * removeCommasAndConvertToBN("invalid")      // returns BN(0)
 * ```
 */
export function removeCommasAndConvertToBN(numberStr: string): BN {
  const number = removeCommasAndConvertToNumber(numberStr);
  return bnToBn(number);
}
