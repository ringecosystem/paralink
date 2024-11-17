export const CACHE_TIMES = {
  ONE_HOUR: 60 * 60 * 1, // 1 hour in seconds
  ONE_DAY: 60 * 60 * 24, // 24 hours in seconds
  ONE_WEEK: 60 * 60 * 24 * 7 // 7 days in seconds
} as const;

export const API_CACHE_TIME = CACHE_TIMES.ONE_HOUR;
