import '@polkadot/api-augment';
import '@polkadot/types-augment';

import { isFunction, bnToBn } from '@polkadot/util';
import { BN_ZERO } from '@polkadot/util';
import type { BN } from '@polkadot/util';
import { ApiPromise } from '@polkadot/api';
import type { XcAssetData } from './../../types/asset-registry';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';

export async function getAssetBalance({
  api,
  account,
  xcAssetData,
  chainInfo
}: {
  api: ApiPromise;
  account: string;
  xcAssetData?: XcAssetData;
  chainInfo?: ChainInfoWithXcAssetsData;
}): Promise<BN> {
  const assetId = xcAssetData?.asset;
  if (!assetId) {
    return BN_ZERO;
  }
  try {
    if (assetId === 'Native') {
      const balancesAll = await api.derive.balances.all(account);
      return balancesAll.availableBalance;
    }
    if (
      chainInfo?.substrateInfo?.paraId === 1000 &&
      xcAssetData.reserveType === 'foreign'
    ) {
      const result = await api.query.foreignAssets.account(
        JSON.parse(xcAssetData.xcmV1MultiLocation),
        account
      );

      const assetAccount = result.toJSON() as {
        balance: string | number;
      };
      if (!assetAccount) return BN_ZERO;
      return bnToBn(assetAccount?.balance);
    }

    if (isFunction(api.query.assets?.account)) {
      const result = await api.query.assets.account(
        assetId as unknown as number,
        account
      );
      const amount = result.unwrapOrDefault().balance.toBn();
      return amount;
    }

    if (isFunction(api.query.ormlTokens?.account)) {
      const { free } = (
        await api.query.ormlTokens.account(account, assetId)
      ).toJSON() as { free?: string };
      return bnToBn(free ?? 0);
    }

    if (isFunction(api.query.tokens?.accounts)) {
      const { free } = (
        await api.query.tokens.accounts(account, assetId as unknown as number)
      ).toJSON() as { free?: string };
      return bnToBn(free ?? 0);
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
