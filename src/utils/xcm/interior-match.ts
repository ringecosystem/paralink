import { isGeneralKeyV3, normalizeInterior } from './helper';
import type { GeneralKeyV3, NormalizedInterior } from './type';

function normalizeGeneralKey(key: string | GeneralKeyV3): string {
  const rawKey = isGeneralKeyV3(key) ? key.data : key;
  return rawKey.padEnd(66, '0').toLowerCase();
}

function isBifrostSpecialInteriorMatch(
  a: NormalizedInterior | NormalizedInterior[] | null,
  b: NormalizedInterior | NormalizedInterior[] | null
): boolean {
  if (!a || !b) return false;

  if (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === 1 &&
    b.length === 2
  ) {
    if (a?.[0]?.generalKey && b?.[1]?.generalKey) {
      console.log('other is target chain', a, b);
      const keyA = normalizeGeneralKey(a?.[0]?.generalKey);
      const keyB = normalizeGeneralKey(b?.[1]?.generalKey);
      return keyA === keyB;
    }
  }

  if (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === 2 &&
    b.length === 2
  ) {
    const isSourceBifrost = Number(a[0]?.parachain) === 2030;

    if (isSourceBifrost && a[1]?.generalKey && b[1]?.generalKey) {
      console.log('bifrost is source chain', a, b);

      const keyA = normalizeGeneralKey(a[1]?.generalKey);
      const keyB = normalizeGeneralKey(b[1]?.generalKey);

      console.log('keyA', keyA);
      console.log('keyB', keyB);

      return keyA.toLowerCase() === keyB.toLowerCase();
    }
  }

  return false;
}

export function areInteriorsEqual(
  a: NormalizedInterior | NormalizedInterior[] | null,
  b: NormalizedInterior | NormalizedInterior[] | null
): boolean {
  const normalizedA = normalizeInterior(a as NormalizedInterior);
  const normalizedB = normalizeInterior(b as NormalizedInterior);

  if (normalizedA === null || normalizedB === null)
    return normalizedA === normalizedB;

  //   check if it is a special case for Bifrost
  const isBifrostMatch = isBifrostSpecialInteriorMatch(
    normalizedA,
    normalizedB
  );
  if (isBifrostMatch) return true;

  if (Array.isArray(normalizedA) && Array.isArray(normalizedB)) {
    if (normalizedA.length !== normalizedB.length) return false;
    return normalizedA.every((item, index) =>
      compareInteriorItems(item, normalizedB[index])
    );
  }

  if (Array.isArray(normalizedA) || Array.isArray(normalizedB)) return false;

  return compareInteriorItems(normalizedA, normalizedB);
}

function compareInteriorItems(a: any, b: any): boolean {
  if ('parachain' in a && 'parachain' in b) {
    const valueA = String(a.parachain);
    const valueB = String(b.parachain);
    return valueA === valueB;
  }

  if ('palletInstance' in a && 'palletInstance' in b) {
    const valueA = String(a.palletInstance);
    const valueB = String(b.palletInstance);
    return valueA === valueB;
  }

  if ('generalIndex' in a && 'generalIndex' in b) {
    const valueA = String(a.generalIndex);
    const valueB = String(b.generalIndex);
    return valueA === valueB;
  }

  if ('generalKey' in a && 'generalKey' in b) {
    console.log('generalKey', a.generalKey, b.generalKey);
    const keyA = isGeneralKeyV3(a.generalKey)
      ? a.generalKey.data
      : a.generalKey;
    const keyB = isGeneralKeyV3(b.generalKey)
      ? b.generalKey.data
      : b.generalKey;
    return (
      keyA.padEnd(66, '0').toLowerCase() === keyB.padEnd(66, '0').toLowerCase()
    );
  }

  if ('accountKey20' in a && 'accountKey20' in b) {
    const accountA = a.accountKey20;
    const accountB = b.accountKey20;
    return (
      String(accountA?.key) === String(accountB?.key) &&
      String(accountA?.network) === String(accountB?.network)
    );
  }

  if ('globalConsensus' in a && 'globalConsensus' in b) {
    const consensusA = a.globalConsensus;
    const consensusB = b.globalConsensus;

    if (consensusA?.ethereum && consensusB?.ethereum) {
      return (
        String(consensusA.ethereum.chainId) ===
        String(consensusB.ethereum.chainId)
      );
    }

    return consensusA === consensusB;
  }

  return false;
}
