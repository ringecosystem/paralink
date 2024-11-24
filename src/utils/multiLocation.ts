import { ApiPromise } from '@polkadot/api';
import type {
  MultiLocation,
  VersionedMultiLocation
} from '@polkadot/types/interfaces';

export function parseMultiLocation(
  api: ApiPromise,
  location: VersionedMultiLocation
) {
  const decoded = api.createType('VersionedMultiLocation', location);

  return {
    parents: decoded.isV1
      ? decoded.asV1.parents.toNumber()
      : decoded.asV0.parents.toNumber(),
    interior: decoded.isV1
      ? decoded.asV1.interior.toString()
      : decoded.asV0.interior.toString()
  };
}

// 创建 MultiLocation 的工具函数
export function createMultiLocation(
  api: ApiPromise,
  {
    parents = 0,
    parachainId,
    accountId
  }: {
    parents?: number;
    parachainId?: number;
    accountId?: string;
  }
) {
  return api.createType('XcmVersionedMultiLocation', {
    V1: {
      parents,
      interior: {
        X2: [
          { Parachain: parachainId },
          { AccountId32: { network: 'Any', id: accountId } }
        ]
      }
    }
  });
}
