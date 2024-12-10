import { isAddress } from 'viem';
import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { areInteriorsEqual } from './interior-match';
import type { GeneralKeyV3, NormalizedInterior } from './type';
import { ReserveType, type XcAssetData } from '@/types/asset-registry';

export const isGeneralKeyV3 = (
  key: GeneralKeyV3 | string
): key is GeneralKeyV3 => {
  return typeof key === 'object' && 'data' in key && 'length' in key;
};

export function normalizeInterior(
  interior: NormalizedInterior | NormalizedInterior[] | null
): NormalizedInterior[] | null {
  if (!interior) return null;
  if ('here' in interior) return [];
  if ('x1' in interior && interior.x1) return [interior.x1];
  if ('x2' in interior && Array.isArray(interior.x2)) return interior.x2;
  if ('x3' in interior && Array.isArray(interior.x3)) return interior.x3;
  if ('x4' in interior && Array.isArray(interior.x4)) return interior.x4;
  return null;
}

export function flattenXcmInterior(
  xcmLocationStr: string
): NormalizedInterior[] | NormalizedInterior | null {
  try {
    const parsed = JSON.parse(xcmLocationStr);
    const interior = parsed.v1.interior as
      | NormalizedInterior
      | NormalizedInterior[]
      | null;
    return normalizeInterior(interior);
  } catch (error) {
    console.error('Failed to flatten XCM interior:', error);
    return null;
  }
}

export function generateBeneficiary(recipientAddress: string) {
  const accountType = isAddress(recipientAddress)
    ? 'AccountKey20'
    : 'AccountId32';

  return {
    parents: 0,
    interior: {
      X1: {
        [accountType]: {
          network: null,
          [accountType === 'AccountKey20' ? 'key' : 'id']: u8aToHex(
            decodeAddress(recipientAddress)
          )
        }
      }
    }
  };
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
