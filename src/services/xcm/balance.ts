import { isFunction, bnToBn } from '@polkadot/util';
import { BN_ZERO } from '@polkadot/util';
import type { BN } from '@polkadot/util';
import type { ApiPromise } from '@polkadot/api';
import type { Asset } from '@/types/xcm-asset';

interface OrmlTokensAccountData {
  free: string | number;
  reserved: string | number;
  frozen: string | number;
}

export async function getAssetBalance({
  api,
  account,
  asset,
  signal
}: {
  paraId: number;
  api: ApiPromise;
  account: string;
  asset?: Asset;
  signal?: AbortSignal;
}): Promise<BN> {
  const assetId = asset?.assetId;
  if (!assetId) {
    return BN_ZERO;
  }
  try {
    if (signal?.aborted) throw new Error('Request aborted');
    signal?.throwIfAborted();

    if (asset.isNative) {
      console.log('asset', asset);
      const balancesAll = await api.derive.balances.all(account);
      console.log('balancesAll', balancesAll);

      return balancesAll.availableBalance;
    }

    if (isFunction(api.query.assets?.account)) {
      const result = await api.query.assets.account(assetId, account);
      const assetAccount = result.toJSON() as null | {
        balance: string | number;
      };

      if (assetAccount) {
        return bnToBn(assetAccount.balance);
      }
    }

    if (isFunction(api.query.ormlTokens?.account)) {
      const { free } = (
        await api.query.ormlTokens.account(account, assetId)
      ).toJSON() as unknown as OrmlTokensAccountData;
      return bnToBn(free ?? 0);
    }

    if (isFunction(api.query.tokens?.accounts)) {
      const accountData = (
        await api.query.tokens.accounts(account, assetId)
      ).toJSON() as unknown as OrmlTokensAccountData;
      return bnToBn(accountData?.free ?? 0);
    }

    console.warn('No suitable asset query method found');
    return BN_ZERO;
  } catch (error) {
    console.error('Error fetching balance:', error);
    console.error('Asset ID:', assetId);
    console.error('Account:', account);
    return BN_ZERO;
  }
}

//
