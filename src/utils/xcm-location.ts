function isNormalizedInterior(
  interior: NormalizedInterior | NormalizedInterior[] | null
): interior is NormalizedInterior {
  return interior !== null && !Array.isArray(interior);
}

function formatInteriorToRaw(
  interior: NormalizedInterior
): Record<string, unknown> {
  if (interior.Parachain !== undefined)
    return { parachain: interior.Parachain };

  if (interior.PalletInstance !== undefined)
    return { palletInstance: interior.PalletInstance };

  if (interior.GeneralIndex !== undefined)
    return { generalIndex: interior.GeneralIndex };

  if (interior.GeneralKey)
    return {
      generalKey: {
        ...(interior.GeneralKey.length && {
          length: interior.GeneralKey.length
        }),
        data: interior.GeneralKey.data
      }
    };

  if (interior.AccountId32)
    return {
      accountId32: {
        ...(interior.AccountId32.network && {
          network: interior.AccountId32.network
        }),
        id: interior.AccountId32.id
      }
    };

  if (interior.AccountKey20)
    return {
      accountKey20: {
        network: interior.AccountKey20.network,
        key: interior.AccountKey20.key
      }
    };

  if (interior.GlobalConsensus) {
    if (interior.GlobalConsensus.Ethereum)
      return {
        globalConsensus: {
          Ethereum: {
            chainId: interior.GlobalConsensus.Ethereum.chainId
          }
        }
      };
    if (interior.GlobalConsensus.Polkadot)
      return { globalConsensus: 'Polkadot' };
    if (interior.GlobalConsensus.Kusama) return { globalConsensus: 'Kusama' };
  }

  return { here: true };
}

export interface NormalizedLocation {
  parents: number;
  interior: NormalizedInterior | NormalizedInterior[] | null;
}

interface NormalizedInterior {
  Parachain?: number;
  PalletInstance?: number;
  GeneralIndex?: number | string;
  GeneralKey?: {
    length?: number;
    data: string;
  };
  AccountId32?: {
    network?: string | null;
    id: string;
  };
  AccountKey20?: {
    network: string | null;
    key: string;
  };
  GlobalConsensus?: {
    Ethereum?: {
      chainId: string | number;
    };
    Polkadot?: boolean;
    Kusama?: boolean;
  };
  Here?: boolean;
}

type JunctionType = 'X1' | 'X2' | 'X3' | 'X4' | null;

interface NormalizedLocationWithJunctions extends NormalizedLocation {
  junctions?: JunctionType;
}

/**
 * Parses and normalizes a complete XCM location including parents and interior
 *
 * @param rawData - The raw XCM location data to parse
 * @returns A normalized location object containing parents and interior, or null if invalid
 *
 * @example
 * // Basic parachain location
 * parseAndNormalizeXcm({
 *   v1: {
 *     parents: 1,
 *     interior: { x1: { parachain: 1000 } }
 *   }
 * })
 * // Returns: {
 * //   parents: 1,
 * //   interior: { Parachain: 1000 }
 * // }
 *
 * @example
 * // Complex location with multiple interiors
 * parseAndNormalizeXcm({
 *   v1: {
 *     parents: 1,
 *     interior: {
 *       x2: [
 *         { parachain: 1000 },
 *         { accountId32: { network: "any", id: "0x1234..." } }
 *       ]
 *     }
 *   }
 * })
 * // Returns: {
 * //   parents: 1,
 * //   interior: [
 * //     { Parachain: 1000 },
 * //     { AccountId32: { network: "any", id: "0x1234..." } }
 * //   ]
 * // }
 *
 * @example
 * // Global consensus location
 * parseAndNormalizeXcm({
 *   v1: {
 *     parents: 0,
 *     interior: {
 *       x1: { globalConsensus: "Polkadot" }
 *     }
 *   }
 * })
 * // Returns: {
 * //   parents: 0,
 * //   interior: { GlobalConsensus: { Polkadot: true } }
 * // }
 */
export function parseAndNormalizeXcm(
  rawData: unknown
): NormalizedLocationWithJunctions | null {
  try {
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

    if (!data?.v1) return null;
    const { interior, junctions } = parseAndNormalizeInterior(data.v1.interior);

    return {
      parents: Number(data.v1.parents),
      interior,
      junctions
    };
  } catch (error) {
    console.error('Error parsing XCM location:', error);
    return null;
  }
}

/**
 * Parses and normalizes XCM interior data into a standardized format
 *
 * @param rawData - The raw interior data to parse, can be a string or object
 * @returns A normalized interior object, array of interior objects, or null if invalid
 *
 * @example
 * // Single interior with Parachain
 * parseAndNormalizeInterior({ x1: { parachain: 1000 } })
 * // Returns: { Parachain: 1000 }
 *
 * @example
 * // Multiple interiors with x2
 * parseAndNormalizeInterior({
 *   x2: [
 *     { parachain: 1000 },
 *     { generalKey: { data: "0x..." } }
 *   ]
 * })
 * // Returns: [
 * //   { Parachain: 1000 },
 * //   { GeneralKey: { data: "0x..." } }
 * // ]
 *
 * @example
 * // Here case
 * parseAndNormalizeInterior("Here")
 * // Returns: { Here: true }
 */
export function parseAndNormalizeInterior(rawData: unknown): {
  interior: NormalizedInterior | NormalizedInterior[] | null;
  junctions: JunctionType | null;
} {
  try {
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

    if (data === 'Here' || (typeof data === 'object' && 'here' in data)) {
      return { interior: { Here: true }, junctions: null };
    }

    if (Array.isArray(data)) {
      return {
        interior: data.map((item) => normalizeInteriorItem(item)),
        junctions: `X${data.length}` as JunctionType
      };
    }

    if (typeof data === 'object' && data !== null) {
      // 处理x1、x2、x3等特殊情况
      if ('x1' in data)
        return { interior: normalizeInteriorItem(data.x1), junctions: 'X1' };

      if ('x2' in data)
        return {
          interior: (data.x2 as Record<string, unknown>[]).map((i) =>
            normalizeInteriorItem(i)
          ),
          junctions: 'X2'
        };
      if ('x3' in data)
        return {
          interior: (data.x3 as Record<string, unknown>[]).map((i) =>
            normalizeInteriorItem(i)
          ),
          junctions: 'X3'
        };
      if ('x4' in data)
        return {
          interior: (data.x4 as Record<string, unknown>[]).map((i) =>
            normalizeInteriorItem(i)
          ),
          junctions: 'X4'
        };

      return { interior: normalizeInteriorItem(data), junctions: null };
    }

    return { interior: null, junctions: null };
  } catch (error) {
    console.error('Error parsing interior:', error);
    return { interior: null, junctions: null };
  }
}

export function createStandardXcmInterior({
  interior,
  junctions
}: {
  interior: NormalizedInterior | NormalizedInterior[] | null;
  junctions?: JunctionType;
}): Record<string, unknown> {
  if (!interior || (isNormalizedInterior(interior) && interior.Here))
    return { here: true };

  if (isNormalizedInterior(interior))
    return { x1: formatInteriorToRaw(interior) };

  if (Array.isArray(interior)) {
    const junctionKey = junctions?.toLowerCase() || `X${interior.length}`;
    return { [junctionKey]: interior.map(formatInteriorToRaw) };
  }

  return { here: true };
}

function normalizeInteriorItem(
  item: Record<string, unknown>
): NormalizedInterior {
  const normalized: NormalizedInterior = {};

  // Parachain
  if ('parachain' in item || 'Parachain' in item) {
    normalized.Parachain = Number(item.parachain || item.Parachain);
  }

  // PalletInstance
  if ('palletInstance' in item || 'PalletInstance' in item) {
    normalized.PalletInstance = Number(
      item.palletInstance || item.PalletInstance
    );
  }

  // GeneralIndex
  if ('generalIndex' in item || 'GeneralIndex' in item) {
    const value = item.generalIndex || item.GeneralIndex;
    normalized.GeneralIndex = typeof value === 'string' ? value : Number(value);
  }

  // GeneralKey
  if ('generalKey' in item || 'GeneralKey' in item) {
    const key = item.generalKey || item.GeneralKey;
    if (typeof key === 'object' && key !== null) {
      normalized.GeneralKey = {
        length: 'length' in key ? Number(key.length) : undefined,
        data: String('data' in key ? key.data : key)
      };
    } else {
      normalized.GeneralKey = {
        data: String(key)
      };
    }
  }

  // AccountId32
  if ('accountId32' in item || 'AccountId32' in item) {
    const account = item.accountId32 || item.AccountId32;
    if (typeof account === 'object' && account !== null) {
      normalized.AccountId32 = {
        network:
          'network' in account ? (account.network as string | null) : null,
        id: String('id' in account ? account.id : account)
      };
    } else {
      normalized.AccountId32 = {
        network: null,
        id: String(account)
      };
    }
  }

  // AccountKey20
  if ('accountKey20' in item || 'AccountKey20' in item) {
    const account = item.accountKey20 || item.AccountKey20;
    if (typeof account === 'object' && account !== null) {
      normalized.AccountKey20 = {
        network:
          'network' in account ? (account.network as string | null) : null,
        key: String('key' in account ? account.key : account)
      };
    }
  }

  // GlobalConsensus
  if ('globalConsensus' in item || 'GlobalConsensus' in item) {
    const consensus = item.globalConsensus || item.GlobalConsensus;
    normalized.GlobalConsensus = {} as Record<string, unknown>;

    if (typeof consensus === 'object' && consensus !== null) {
      if ('Ethereum' in consensus) {
        normalized.GlobalConsensus.Ethereum = {
          chainId: (consensus?.Ethereum as Record<string, string | number>)
            ?.chainId
        };
      }
      if ('Polkadot' in consensus) normalized.GlobalConsensus.Polkadot = true;
      if ('Kusama' in consensus) normalized.GlobalConsensus.Kusama = true;
    } else if (consensus === 'Polkadot') {
      normalized.GlobalConsensus.Polkadot = true;
    } else if (consensus === 'Kusama') {
      normalized.GlobalConsensus.Kusama = true;
    }
  }

  return normalized;
}
