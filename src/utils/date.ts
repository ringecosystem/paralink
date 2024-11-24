import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
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
