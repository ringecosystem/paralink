import { isNil } from 'lodash-es';
import { isGeneralKeyV3, normalizeInterior } from './helper';
import type {
  XcmInterior,
  XcmJunction,
  XcmRequestInteriorParams,
  XcmRequestJunctionParams
} from '@/types/xcm-location';

export function normalizeInteriorItem(
  item: Omit<XcmJunction, 'here'>
): XcmRequestInteriorParams {
  const normalized: XcmRequestJunctionParams = {};
  // Parachain
  if ('parachain' in item && !isNil(item.parachain)) {
    normalized.Parachain = item.parachain;
  }

  // PalletInstance
  if ('palletInstance' in item && !isNil(item.palletInstance)) {
    normalized.PalletInstance = item.palletInstance;
  }

  // GeneralIndex
  if ('generalIndex' in item && !isNil(item.generalIndex)) {
    const value = item.generalIndex;
    normalized.GeneralIndex = typeof value === 'string' ? value : Number(value);
  }

  // GeneralKey
  if ('generalKey' in item && !isNil(item.generalKey)) {
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
  interior: XcmInterior
): XcmRequestInteriorParams | XcmRequestInteriorParams[] | null {
  const normalizedInterior = normalizeInterior(interior);
  if (!normalizedInterior) return null;

  if (Array.isArray(normalizedInterior)) {
    if (normalizedInterior.length === 0) return { Here: null };
    if (normalizedInterior.length === 1)
      return {
        [`X${normalizedInterior.length}`]: normalizeInteriorItem(
          normalizedInterior[0]
        )
      };
    return {
      [`X${normalizedInterior.length}`]: normalizedInterior.map(
        normalizeInteriorItem
      )
    };
  }
  return null;
}

export function createStandardXcmInteriorByFlatInterior(
  interior: XcmJunction[]
): XcmRequestInteriorParams | XcmRequestInteriorParams[] | null {
  if (Array.isArray(interior)) {
    if (interior.length === 0) return { Here: null };
    if (interior.length === 1)
      return {
        [`X${interior.length}`]: normalizeInteriorItem(interior[0])
      };
    return {
      [`X${interior.length}`]: interior.map(normalizeInteriorItem)
    };
  }
  return null;
}

export function createStandardXcmInteriorByFilterParaId(
  paraId: number,
  interior: XcmInterior
): XcmRequestInteriorParams | XcmRequestInteriorParams[] | null {
  const normalizedInterior = normalizeInterior(interior);
  if (Array.isArray(normalizedInterior)) {
    const filteredInterior = normalizedInterior?.filter(
      (item) => !('parachain' in item && item.parachain === paraId)
    );
    return createStandardXcmInteriorByFlatInterior(filteredInterior);
  }
  return null;
}
