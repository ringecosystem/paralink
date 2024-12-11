import { ReserveType } from '../type';

export function getValidWssEndpoints(
  providers: Record<string, string>
): string[] {
  const endpoints = Object.values(providers)?.filter((provider) =>
    provider.includes('wss://')
  );
  if (endpoints.length === 0) {
    throw new Error('No valid WSS endpoints found');
  }
  return endpoints;
}

export function hasParachainInLocation({
  multiLocationStr,
  paraId
}: {
  multiLocationStr: string;
  paraId: string;
}): boolean {
  try {
    const multiLocation = JSON.parse(multiLocationStr);
    const interior = multiLocation.v1.interior;
    const locationArray =
      interior.x1 || interior.x2 || interior.x3 || interior.x4 || [];
    return Array.isArray(locationArray)
      ? locationArray.some(
          (v: { [key: string]: string | number }) =>
            'parachain' in v && v.parachain?.toString() === paraId
        )
      : 'parachain' in locationArray &&
          locationArray.parachain?.toString() === paraId;
  } catch (error) {
    console.error('Error parsing multiLocation:', error);
    return false;
  }
}

export function getGeneralIndex(multiLocationStr: string): string | null {
  try {
    const multiLocation = JSON.parse(multiLocationStr);
    const interior = multiLocation.v1?.interior;
    const locationArray = interior.x1 || interior.x2 || interior.x3 || [];

    const generalIndexObj = Array.isArray(locationArray)
      ? locationArray.find(
          (v: { [key: string]: string | number }) => 'generalIndex' in v
        )
      : 'generalIndex' in locationArray
        ? locationArray
        : null;

    return generalIndexObj?.generalIndex?.toString() || null;
  } catch (error) {
    console.error('Error parsing multiLocation for generalIndex:', error);
    return null;
  }
}

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

export function determineReserveType({
  sourceParaId,
  targetParaId,
  originChainReserveLocation
}: {
  sourceParaId: number;
  targetParaId: number;
  originChainReserveLocation?: string;
}): ReserveType {
  if (targetParaId === 1000 && !originChainReserveLocation)
    return ReserveType.Foreign;
  if (originChainReserveLocation) {
    const reserveLocation = parseReserveLocation(originChainReserveLocation);
    if (!reserveLocation) {
      console.log('No reserve location found', sourceParaId, targetParaId);
      return ReserveType.Remote;
    }
    if (reserveLocation.parents === '0') return ReserveType.Local;
    if (reserveLocation.parents === '1') {
      if (!reserveLocation.parachain) {
        console.log('No parachain found', sourceParaId, targetParaId);
        return ReserveType.Remote;
      }
      if (Number(reserveLocation.parachain) === targetParaId)
        return ReserveType.Foreign;
    }
  }

  console.log('No reserve location found', sourceParaId, targetParaId);
  return ReserveType.Remote;
}
