// 源链是 native token 的情况下， min: 大于0 max: current balance - existentialDeposit - (如果是native token cross) ,
// 目标链是 native token 的情况下： min: 目标链的对应token余额需要大于existentialDeposit ？   max：current balance
// 源链和目标链都不是 native token 的时候： min: 源链的 asset 模块 or token 模块获取， max: current balance

import { Asset } from '@/types/assets-info';
import { ApiPromise } from '@polkadot/api';
import { BN, BN_ZERO } from '@polkadot/util';
import { u128 } from '@polkadot/types';
import { getAssetBalance } from '@/lib/chain/balance';
import { XcAssetData } from '@/types/asset-registry';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';
import { getTokenList } from './xcm-chain-registry';
import { getTokenFromXcAsset } from '@/lib/registry';

// min的写法：
// 针对 Asset token，分两种:
// Dot 情况比较特殊，hardcode
// 其他 tokens 基本上都是在 AssetHub 注册的，那我们直接在 AssetHub 的 assets 那边查询即可。
// 如果该 token metadata 不在 Assethub 上注册，先按照 1 * decimal harccode，记录一个 issue，我之后看一下该怎么具体处理。

export const getMinAmount = (token: Asset) => {
  switch (token.assetType) {
  }
};

export const getExistentialDeposit = (api: ApiPromise): BN => {
  try {
    const ed = api.consts.balances.existentialDeposit as unknown as u128;

    return ed ? ed.toBn() : BN_ZERO;
  } catch (error) {
    console.error('Error fetching existential deposit:', error);
    return BN_ZERO;
  }
};

// 源链是 native token 时，返回的 min和 max
export const getMinAndMaxAmountForNativeToken = async (
  api: ApiPromise,
  token: XcAssetData,
  address: string,
  crossChainFee: BN
) => {
  const existentialDeposit = getExistentialDeposit(api);
  let max = BN_ZERO;

  const currentBalance = await getAssetBalance({
    api,
    account: address,
    xcAssetData: token
  });

  const availableBalance = currentBalance
    .sub(existentialDeposit)
    .sub(crossChainFee);

  max = availableBalance.gt(BN_ZERO) ? availableBalance : BN_ZERO;

  return { min: BN_ZERO, max };
};

type GetAvailableTokensType = {
  fromChain: ChainInfoWithXcAssetsData;
  toChain: ChainInfoWithXcAssetsData;
  assets: Asset[];
};

export type AvailableTokens = {
  symbol?: string;
  decimals?: number;
  icon: string;
  name: string;
  xcAssetData: XcAssetData;
  balance?: BN;
  contractAddress?: string;
};

export function getAvailableTokens({
  fromChain,
  toChain,
  assets
}: GetAvailableTokensType): AvailableTokens[] {
  const tokens = getTokenList({ fromChain, toChain });
  return tokens?.map((v) => {
    const data = getTokenFromXcAsset({ xcAssetData: v, assets });
    return {
      symbol: data?.symbol,
      decimals: data?.decimals,
      icon: data?.icon ?? '/images/default-token.svg',
      name: data?.name ?? data?.symbol,
      xcAssetData: v,
      balance: undefined,
      contractAddress: undefined
    };
  });
}
