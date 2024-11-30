import { isEqual } from 'lodash-es';
import type { MultiLocation } from '@polkadot/types/interfaces';

export function isXcmLocationMatch(
  sourceChainId: number | string,
  location1: MultiLocation | null | undefined,
  location2: MultiLocation | null | undefined
): boolean {
  if (!location1 || !location2) {
    console.log(`One or both locations are empty:`, {
      location1,
      location2
    });
    return false;
  }

  try {
    const parsed1 =
      typeof location1 === 'string' ? JSON.parse(location1) : location1;
    const parsed2 =
      typeof location2 === 'string' ? JSON.parse(location2) : location2;

    if (
      !isRelevantToChain(parsed1, sourceChainId) ||
      !isRelevantToChain(parsed2, sourceChainId)
    )
      return false;

    return compareLocations(parsed1, parsed2);
  } catch (error) {
    console.log(`JSON parsing error:`, error);
    return false;
  }
}

function compareLocations(item1: any, item2: any): boolean {
  if (item1 === null || item2 === null) return item1 === item2;

  if ('interior' in item1 || 'interior' in item2) {
    const array1 = getInteriorArray(item1.interior);
    const array2 = getInteriorArray(item2.interior);

    if (array1 === null || array2 === null) return false;

    if (array1.length !== array2.length) return false;

    return array1.every((item: any, index: number) => {
      const a = item;
      const b = array2[index];

      if ('parachain' in a && 'parachain' in b) {
        if (Number(a.parachain) !== Number(b.parachain)) return false;
      }

      const aKeys = Object.keys(a).filter((k) => k !== 'parachain');
      const bKeys = Object.keys(b).filter((k) => k !== 'parachain');

      if (aKeys.length !== bKeys.length) return false;

      return aKeys.every((key) => {
        const aValue = a[key];
        const bValue = b[key];

        if (
          (typeof aValue === 'object' && aValue !== null) ||
          (typeof bValue === 'object' && bValue !== null)
        ) {
          return isEqual(aValue, bValue);
        }

        if (
          (typeof aValue === 'string' || typeof aValue === 'number') &&
          (typeof bValue === 'string' || typeof bValue === 'number')
        ) {
          return String(aValue) === String(bValue);
        }

        return aValue === bValue;
      });
    });
  }

  return isEqual(item1, item2);
}

function isRelevantToChain(location: any, chainId: number | string): boolean {
  if (!location?.interior) return false;

  const interiorArray = getInteriorArray(location.interior);
  if (!interiorArray) return false;
  return interiorArray.some((item: any) => item.parachain === Number(chainId));
}

function getInteriorArray(interior: any) {
  if ('here' in interior) return [];
  if ('x1' in interior) return [interior.x1];
  if ('x2' in interior) return interior.x2;
  if ('x3' in interior) return interior.x3;
  if ('x4' in interior) return interior.x4;
  return null;
}
