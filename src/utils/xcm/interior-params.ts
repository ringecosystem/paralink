import { isGeneralKeyV3, normalizeInterior } from './helper';
import type { NormalizedInterior, XcmRequestInteriorParams } from './type';

export function normalizeInteriorItem(
  item: Omit<NormalizedInterior, 'here'>
): XcmRequestInteriorParams {
  const normalized: XcmRequestInteriorParams = {};
  // Parachain
  if ('parachain' in item && !!item.parachain) {
    normalized.Parachain = item.parachain;
  }

  // PalletInstance
  if ('palletInstance' in item && !!item.palletInstance) {
    normalized.PalletInstance = item.palletInstance;
  }

  // GeneralIndex
  if ('generalIndex' in item && !!item.generalIndex) {
    const value = item.generalIndex;
    normalized.GeneralIndex = typeof value === 'string' ? value : Number(value);
  }

  // GeneralKey
  if ('generalKey' in item && !!item.generalKey) {
    if (isGeneralKeyV3(item.generalKey)) {
      normalized.GeneralKey = item.generalKey;
    } else {
      normalized.GeneralKey = {
        length: 2,
        data: item.generalKey?.padEnd(66, '0').toLowerCase()
      };
    }
  }

  // AccountId32
  if ('accountId32' in item && !!item.accountId32) {
    normalized.AccountId32 = item.accountId32;
  }

  // AccountKey20
  if ('accountKey20' in item && !!item.accountKey20) {
    normalized.AccountKey20 = item.accountKey20;
  }

  // GlobalConsensus
  if ('globalConsensus' in item && !!item.globalConsensus) {
    normalized.GlobalConsensus = item.globalConsensus;
  }

  return normalized;
}

export function createStandardXcmInterior(
  interior: NormalizedInterior | NormalizedInterior[]
): XcmRequestInteriorParams | XcmRequestInteriorParams[] | null {
  const normalizedInterior = normalizeInterior(interior);
  if (Array.isArray(normalizedInterior)) {
    if (normalizedInterior.length === 0) return { Here: null };
    return {
      [`X${normalizedInterior.length}`]: normalizedInterior.map(
        normalizeInteriorItem
      )
    };
  }
  return null;
}
