import type { Asset } from '../type';

export function findIconBySymbol(symbol: string, assets: Asset[]) {
  const targetSymbol = symbol.toLowerCase();
  const regex = new RegExp(`^([a-z]*${targetSymbol}|${targetSymbol}[a-z]*)$`);
  return (
    assets?.find((asset) => regex.test(asset.symbol?.toLowerCase()))?.icon ||
    '/images/default-token.svg'
  );
}
