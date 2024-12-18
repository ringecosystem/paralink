import dayjs, { extend, unix } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
extend(relativeTime);
dayjs.extend(utc);

export function formatBridgeTransactionTimestamp(): string {
  return dayjs().utc().format('MMM-DD-YYYY hh:mm:ss A [+UTC]');
}

export function formatShortDate(date: Date): string {
  return dayjs(date).format('MMM DD, YYYY');
}

export function formatFullDateTime(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}
export function formatTimeAgo(timestamp: string) {
  const date = unix(Number(timestamp));
  return dayjs().from(date);
}

/**
 * Promise with timeout control
 * @param promise Original Promise
 * @param timeout Timeout duration (milliseconds)
 * @returns Promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeout: number
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeout}ms`));
    }, timeout);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Delay for specified time
 * @param ms Delay duration (milliseconds)
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
