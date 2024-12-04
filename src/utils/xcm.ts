import { ReserveType } from '@/types/asset-registry';
import { areInteriorsEqual } from '@/utils/xcm/interior-match';
import type { XcAssetData } from '@/types/asset-registry';

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
  currentParaId,
  paraID,
  originChainReserveLocation
}: {
  currentParaId: number;
  paraID: number;
  originChainReserveLocation?: string;
}): ReserveType {
  if (paraID === 1000 && !originChainReserveLocation) return ReserveType.Local;
  if (originChainReserveLocation) {
    const reserveLocation = parseReserveLocation(originChainReserveLocation);
    if (!reserveLocation) {
      console.log('No reserve location found', currentParaId, paraID);
      return ReserveType.Remote;
    }
    if (reserveLocation.parents === '0') return ReserveType.Local;
    if (reserveLocation.parents === '1') {
      if (!reserveLocation.parachain) {
        console.log('No parachain found', currentParaId, paraID);
        return ReserveType.Remote;
      }
      if (Number(reserveLocation.parachain) === paraID)
        return ReserveType.Foreign;
    }
  }

  console.log('No reserve location found', currentParaId, paraID);
  return ReserveType.Remote;
}

export function isXcmLocationMatch({
  acceptablePaymentLocation,
  asset
}: {
  acceptablePaymentLocation: any | null | undefined;
  asset: XcAssetData;
}): boolean {
  const xcmLocation = JSON.parse(asset?.xcmV1MultiLocation)?.v1;

  if (!acceptablePaymentLocation || !xcmLocation) {
    console.log(`One or both locations are empty:`, {
      acceptablePaymentLocation,
      xcmLocation
    });
    return false;
  }

  if (
    Number(acceptablePaymentLocation?.parents) === 0 &&
    typeof acceptablePaymentLocation?.interior?.here !== 'undefined' &&
    asset?.reserveType === ReserveType.Foreign
  ) {
    console.log('native token', { acceptablePaymentLocation, xcmLocation });
    return true;
  }

  try {
    const parsedAcceptablePaymentLocation =
      typeof acceptablePaymentLocation === 'string'
        ? JSON.parse(acceptablePaymentLocation)
        : acceptablePaymentLocation;
    const parsedXcmLocation =
      typeof xcmLocation === 'string' ? JSON.parse(xcmLocation) : xcmLocation;

    return areInteriorsEqual(
      parsedAcceptablePaymentLocation?.interior,
      parsedXcmLocation?.interior
    );
  } catch (error) {
    console.log(`JSON parsing error:`, error);
    return false;
  }
}
