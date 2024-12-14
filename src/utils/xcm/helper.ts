import { isAddress } from 'viem';
import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { isNil } from 'lodash-es';
import { ReserveType } from '@/types/xcm-asset';

import { areInteriorsEqual } from './interior-match';

import type {
  GeneralKeyV3,
  XcmInterior,
  XcmJunction
} from '@/types/xcm-location';
import type { Asset } from '@/types/xcm-asset';
import type { XcmV1Location } from '@/types/xcm-location';

export const isGeneralKeyV3 = (
  key: GeneralKeyV3 | string
): key is GeneralKeyV3 => {
  return typeof key === 'object' && 'data' in key && 'length' in key;
};

export function normalizeInterior(
  interior: XcmInterior | null
): XcmJunction[] | null {
  if (!interior) return null;
  if ('here' in interior) return [];
  if ('x1' in interior && interior.x1) return [interior.x1];
  if ('x2' in interior && Array.isArray(interior.x2)) return interior.x2;
  if ('x3' in interior && Array.isArray(interior.x3)) return interior.x3;
  if ('x4' in interior && Array.isArray(interior.x4)) return interior.x4;
  return null;
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
  asset,
  targetChainId
}: {
  acceptablePaymentLocation: any | null | undefined;
  asset: Asset;
  targetChainId: number;
}): boolean {
  console.log('asset', asset);
  const xcmLocation = asset?.xcmLocation?.v1;

  if (isDotLocation(asset?.xcmLocation)) {
    return true;
  }

  if (!acceptablePaymentLocation || !xcmLocation) {
    console.log(`One or both locations are empty:`, {
      acceptablePaymentLocation,
      xcmLocation
    });
    return false;
  }

  const acceptablePaymentLocationIsNative =
    (Number(acceptablePaymentLocation?.parents) === 0 &&
      typeof acceptablePaymentLocation?.interior?.here !== 'undefined') ||
    (Number(acceptablePaymentLocation?.parents) === 0 &&
      acceptablePaymentLocation?.interior?.x1?.palletInstance);

  const assetIsNative =
    asset?.reserveType === ReserveType.Foreign &&
    (asset?.xcmLocation?.v1?.interior?.x1?.parachain === targetChainId ||
      asset?.xcmLocation?.v1?.interior?.x2?.some(
        (item) => 'parachain' in item && item.parachain === targetChainId
      ));

  if (acceptablePaymentLocationIsNative && assetIsNative) {
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

export const destLocationIsNativeAsset = ({
  asset,
  paraId
}: {
  asset: Asset;
  paraId: number;
}): boolean => {
  if (asset?.reserveType !== ReserveType.Foreign) {
    return false;
  }

  const interior = asset?.xcmLocation?.v1?.interior;

  if (interior?.x1?.parachain === paraId) {
    return true;
  }

  if (interior?.x2) {
    return interior.x2.some(
      (item) =>
        ('parachain' in item && item.parachain === paraId) ||
        ('generalIndex' in item && !isNil(item.generalIndex))
    );
  }

  return false;
};

export function isDotLocation(xcmLocation: XcmV1Location): boolean {
  return (
    xcmLocation?.v1?.parents === 1 && xcmLocation?.v1?.interior?.here === null
  );
}
