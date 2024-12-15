import { isEqual } from 'lodash';

function normalizeGeneralKey(key: any): string {
  if (typeof key === 'string') {
    return key.toLowerCase();
  }
  if (key?.data) {
    return key.data.substring(0, 6).toLowerCase();
  }
  return '';
}

const processInterior = (interior: any) => {
  const processItem = (item: any) => {
    if (item?.generalKey) {
      return {
        generalKey: normalizeGeneralKey(item.generalKey)
      };
    }
    return item;
  };
  if (interior.x1) {
    return [processItem(interior.x1)];
  }
  if (interior.x2) {
    return interior.x2.map(processItem);
  }
  if (interior.x3) {
    return interior.x3.map(processItem);
  }
  if (interior.x4) {
    return interior.x4.map(processItem);
  }
  return [];
};

function parseXcmLocation(xcmLocation: string) {
  try {
    const location = JSON.parse(xcmLocation);
    const interior = location?.v1?.interior;
    if (!interior) return null;
    return {
      parents: location.v1.parents,
      interior: processInterior(interior)
    };
  } catch (e) {
    console.error('Failed to parse XCM location:', e);
    return null;
  }
}

export function isSameLocation(location1: string, location2: string): boolean {
  const parsed1 = parseXcmLocation(location1);
  const parsed2 = parseXcmLocation(location2);
  if (!parsed1 || !parsed2) return false;
  // if (parsed1.parents !== parsed2.parents) return false;
  if (parsed1.interior.length !== parsed2.interior.length) return false;
  return parsed1.interior.every((item1: any, index: number) => {
    const item2 = parsed2.interior[index];
    if (item1?.generalKey && item2?.generalKey) {
      return item1.generalKey === item2.generalKey;
    }
    return isEqual(item1, item2);
  });
}
