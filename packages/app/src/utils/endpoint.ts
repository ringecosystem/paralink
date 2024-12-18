/**
 * Sort RPC endpoints based on priority
 * Priority order: onfinality > dwellir > blastapi > others
 * @param providers Array of RPC endpoint URLs
 * @returns Sorted array of RPC endpoint URLs
 */
export const sortEndpoints = (providers: string[]): string[] => {
  return [...providers].sort((a, b) => {
    const getPriority = (url: string): number => {
      if (url.includes('onfinality')) return 1;
      if (url.includes('dwellir')) return 2;
      if (url.includes('blastapi')) return 3;
      return 4;
    };
    return getPriority(a) - getPriority(b);
  });
};
