import { ApiPromise, WsProvider } from '@polkadot/api';
import { ReserveType } from '../type';

export function getValidWssEndpoints(
  providers: Record<string, string>
): string[] {
  const endpoints = Object.values(providers)?.filter((provider) =>
    provider.includes('wss://')
  );
  if (endpoints.length === 0) {
    throw new Error('No valid WSS endpoints found');
  }
  return endpoints;
}

export function hasParachainInLocation({
  multiLocationStr,
  paraId
}: {
  multiLocationStr: string;
  paraId: string;
}): boolean {
  try {
    const multiLocation = JSON.parse(multiLocationStr);
    const interior = multiLocation.v1.interior;
    const locationArray =
      interior.x1 || interior.x2 || interior.x3 || interior.x4 || [];
    return Array.isArray(locationArray)
      ? locationArray.some(
        (v: { [key: string]: string | number }) =>
          'parachain' in v && v.parachain?.toString() === paraId
      )
      : 'parachain' in locationArray &&
      locationArray.parachain?.toString() === paraId;
  } catch (error) {
    console.error('Error parsing multiLocation:', error);
    return false;
  }
}

export function getGeneralIndex(multiLocationStr: string): string | null {
  try {
    const multiLocation = JSON.parse(multiLocationStr);
    const interior = multiLocation.v1?.interior;
    const locationArray = interior.x1 || interior.x2 || interior.x3 || [];

    const generalIndexObj = Array.isArray(locationArray)
      ? locationArray.find(
        (v: { [key: string]: string | number }) => 'generalIndex' in v
      )
      : 'generalIndex' in locationArray
        ? locationArray
        : null;

    return generalIndexObj?.generalIndex?.toString() || null;
  } catch (error) {
    console.error('Error parsing multiLocation for generalIndex:', error);
    return null;
  }
}


export function determineReserveType({
  sourceParaId,
  targetParaId,
  originChainReserveLocation
}: {
  sourceParaId: number | string;
  targetParaId: number | string;
  originChainReserveLocation?: string;
}): ReserveType {
  if (Number(targetParaId) === 1000) {
    return ReserveType.Foreign;
  }
  if (originChainReserveLocation) {
    try {
      const reserveLocation = JSON.parse(originChainReserveLocation);
      if (reserveLocation.parents === '0') return ReserveType.Local;
      if (reserveLocation.parents === '1') {
        if ('X1' in reserveLocation.interior) {
          if (Number(reserveLocation.interior.X1.Parachain) === Number(targetParaId)) {
            return ReserveType.Foreign;
          }
          return ReserveType.Remote;
        }
        if ('X2' in reserveLocation.interior && Array.isArray(reserveLocation.interior.X2)) {
          if ((reserveLocation.interior.X2)?.some(v => {
            return 'Parachain' in v && Number(v.Parachain) === Number(targetParaId)
          })) {
            return ReserveType.Foreign;
          }
          return ReserveType.Remote;
        }
        if ('X3' in reserveLocation.interior && Array.isArray(reserveLocation.interior.X3)) {
          if ((reserveLocation.interior.X3)?.some(v => {
            return 'Parachain' in v && Number(v.Parachain) === Number(targetParaId)
          })) {
            return ReserveType.Foreign;
          }
          return ReserveType.Remote;
        }
        if ('X4' in reserveLocation.interior && Array.isArray(reserveLocation.interior.X4)) {
          if ((reserveLocation.interior.X4)?.some(v => {
            return 'Parachain' in v && Number(v.Parachain) === Number(targetParaId)
          })) {
            return ReserveType.Foreign;
          }
          return ReserveType.Remote;
        }
        return ReserveType.Remote;
      }
    } catch (error) {
      return ReserveType.Remote;
    }

  }

  console.log('No reserve location found', sourceParaId, targetParaId);
  return ReserveType.Remote;
}


export async function connectToChain(endpoints: string[]) {
  for (const endpoint of endpoints) {
    try {
      console.log('excuting endpoint', endpoint);
      const api = await ApiPromise.create({
        provider: new WsProvider(endpoint, 1_000, {}, 5_000),
        throwOnConnect: true
      });

      console.log(`Successfully connected to ${endpoint}`);
      await api.isReady;
      return api;

    } catch (error) {
      console.error(`Failed to connect to ${endpoint}, trying next...`);
      continue;
    }
  }

  throw new Error('All connection attempts failed');
}