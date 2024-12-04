import type { GeneralKeyV3, NormalizedInterior } from './type';

export const isGeneralKeyV3 = (
  key: GeneralKeyV3 | string
): key is GeneralKeyV3 => {
  return typeof key === 'object' && 'data' in key && 'length' in key;
};

export function normalizeInterior(
  interior: NormalizedInterior | NormalizedInterior[]
): NormalizedInterior[] | null {
  if (!interior) return null;
  if ('here' in interior) return [];
  if ('x1' in interior && interior.x1) return [interior.x1];
  if ('x2' in interior && Array.isArray(interior.x2)) return interior.x2;
  if ('x3' in interior && Array.isArray(interior.x3)) return interior.x3;
  if ('x4' in interior && Array.isArray(interior.x4)) return interior.x4;
  return null;
}

export function flattenXcmInterior(xcmLocationStr: string) {
  try {
    const parsed = JSON.parse(xcmLocationStr);
    const interior = parsed.v1.interior as
      | NormalizedInterior[]
      | NormalizedInterior
      | null;

    if (!interior) return null;
    if ('x1' in interior) return [interior.x1];
    if ('x2' in interior && Array.isArray(interior.x2)) return interior.x2;
    if ('x3' in interior && Array.isArray(interior.x3)) return interior.x3;
    if ('x4' in interior && Array.isArray(interior.x4)) return interior.x4;
    return null;
  } catch (error) {
    console.error('Failed to flatten XCM interior:', error);
    return null;
  }
}
