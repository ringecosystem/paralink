import { BN } from '@polkadot/util';

import { getTokenFromXcAsset } from '@/lib/registry';
import { getAssetBalance } from '@/lib/chain/balance';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';
import type { ApiPromise } from '@polkadot/api';
import type { Asset } from '@/types/assets-info';
import type { TokenWithBalance } from '@/types/token';
import { validateTokenFetch } from '@/utils/validators';

interface GetTokensParams {
  fromChain: ChainInfoWithXcAssetsData;
  toChainId: string;
  assets: Asset[];
  address?: string;
  api?: ApiPromise;
}

interface UpdateTokenBalanceParams {
  token: TokenWithBalance;
  address: string;
  api: ApiPromise;
}

function getTokensWithoutBalance({
  fromChain,
  toChainId,
  assets
}: GetTokensParams): TokenWithBalance[] {
  return (fromChain?.xcAssetsData || [])
    ?.filter((v) => v?.paraID?.toString() === toChainId)
    ?.map((v) => {
      const data = getTokenFromXcAsset({ xcAssetData: v, assets });
      return {
        symbol: data?.symbol,
        icon: data?.icon ?? '/images/default-token.svg',
        name: data?.name ?? data?.symbol,
        xcAssetData: v,
        isNative: fromChain?.substrateInfo?.symbol === v?.symbol,
        balance: undefined
      };
    });
}

export async function updateTokenBalance({
  token,
  address,
  api
}: UpdateTokenBalanceParams): Promise<TokenWithBalance> {
  const balance = await getAssetBalance({
    api,
    account: address,
    assetId: token.xcAssetData?.asset ?? undefined
  });

  const decimals = token.xcAssetData?.decimals ?? 0;
  const divisor = new BN(10).pow(new BN(decimals));
  const transferrableBalance = balance.div(divisor).toNumber().toFixed(4);

  return {
    ...token,
    balance: transferrableBalance
  };
}

export async function getTokensWithBalance(
  params: GetTokensParams
): Promise<TokenWithBalance[]> {
  const { address, api } = params;
  if (!address || !api) return getTokensWithoutBalance(params);

  const tokensWithoutBalance = getTokensWithoutBalance(params);

  return Promise.all(
    tokensWithoutBalance.map((token) =>
      updateTokenBalance({ token, address, api })
    )
  );
}

export async function getTokensWithBalanceForChain({
  fromChain,
  toChainId,
  fromChainApi,
  assets,
  evmAddress,
  substrateAddress
}: {
  fromChain: ChainInfoWithXcAssetsData;
  toChainId: string;
  fromChainApi: ApiPromise | null;
  assets: Asset[];
  evmAddress?: string;
  substrateAddress?: string;
}): Promise<TokenWithBalance[]> {
  const validation = validateTokenFetch({
    fromChain,
    toChainId,
    assets,
    evmAddress,
    substrateAddress
  });
  if (!validation.isValid) {
    console.log('error', validation.error);
    return [];
  }

  const tokens = await getTokensWithBalance({
    fromChain,
    toChainId,
    assets,
    address: validation.address,
    api: fromChainApi ?? undefined
  });

  return tokens;
}
