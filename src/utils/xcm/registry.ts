import { ReserveType } from '@/types/registry';
import type { Asset, ChainConfig } from '@/types/registry';

interface ParsedReserveLocation {
  parents: string;
  parachain?: number;
}

function parseReserveLocation(
  originChainReserveLocation?: string
): ParsedReserveLocation | null {
  if (!originChainReserveLocation) return null;

  try {
    const location = JSON.parse(originChainReserveLocation);

    const parents =
      location.parents?.toString() || location.Parents?.toString();
    if (!parents) return null;

    if (
      location.interior?.Here !== undefined ||
      location.Interior?.Here !== undefined
    )
      return { parents };

    const interior = location.interior || location.Interior;
    const x1 = interior?.X1 || interior?.x1;
    const parachain = x1?.Parachain || x1?.parachain;

    if (parachain)
      return {
        parents,
        parachain: Number(parachain)
      };

    return null;
  } catch (error) {
    console.error('Error parsing reserve location:', error);
    return null;
  }
}

export function getFromChains(chains: ChainConfig[]): ChainConfig[] {
  return chains;
}

export function getToChains(
  chains: ChainConfig[],
  sourceChainId: number
): ChainConfig[] {
  return chains?.filter((chain) => chain.id !== sourceChainId);
}

export const getTokenList = ({
  sourceChain,
  targetChainId
}: {
  sourceChain: ChainConfig;
  targetChainId: number;
}) => {
  const tokenList: Asset[] = [];
  if (sourceChain.id === 1000) {
    const tokens = sourceChain?.localAssets?.[targetChainId];
    return tokens || [];
  } else {
    const nativeToken =
      sourceChain?.nativeToken?.registeredChains?.[targetChainId];
    const xcAssetsData = sourceChain?.xcAssetsData?.[targetChainId];

    if (nativeToken) {
      tokenList.push({ ...nativeToken, isNative: true });
    }
    if (Array.isArray(xcAssetsData) && xcAssetsData.length) {
      tokenList.push(...xcAssetsData);
    }

    return tokenList;
  }
};
