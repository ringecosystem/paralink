import { getTokenFromXcAsset } from '@/lib/registry';
import { getAssetBalance } from '@/lib/chain/balance';
import { getTokenList } from '@/utils/xcm-chain-registry';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';
import type { ApiPromise } from '@polkadot/api';
import type { Asset } from '@/types/assets-info';
import type { TokenWithBalance } from '@/types/token';

interface GetTokensParams {
  fromChain: ChainInfoWithXcAssetsData;
  toChain: ChainInfoWithXcAssetsData;
  assets: Asset[];
  address?: string;
  api?: ApiPromise;
}

interface UpdateTokenBalanceParams {
  token: TokenWithBalance;
  address: string;
  api: ApiPromise;
  chainInfo?: ChainInfoWithXcAssetsData;
}

function getTokensWithoutBalance({
  fromChain,
  toChain,
  assets
}: GetTokensParams): TokenWithBalance[] {
  const tokens = getTokenList({ fromChain, toChain });
  return tokens?.map((v) => {
    const data = getTokenFromXcAsset({ xcAssetData: v, assets });
    return {
      symbol: data?.symbol,
      decimals: data?.decimals,
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
  api,
  chainInfo
}: UpdateTokenBalanceParams): Promise<TokenWithBalance> {
  const balance = await getAssetBalance({
    api,
    account: address,
    xcAssetData: token.xcAssetData,
    chainInfo
  });

  return {
    ...token,
    balance
  };
}

export async function getTokensWithBalance(
  params: GetTokensParams
): Promise<TokenWithBalance[]> {
  const { address, api, fromChain } = params;
  if (!address || !api) return getTokensWithoutBalance(params);

  const tokensWithoutBalance = getTokensWithoutBalance(params);

  return Promise.all(
    tokensWithoutBalance.map((token) =>
      updateTokenBalance({ token, address, api, chainInfo: fromChain })
    )
  );
}

export async function getTokensWithBalanceForChain({
  fromChain,
  toChain,
  fromChainApi,
  assets,
  evmAddress,
  substrateAddress
}: {
  fromChain: ChainInfoWithXcAssetsData;
  toChain: ChainInfoWithXcAssetsData;
  fromChainApi: ApiPromise | null;
  assets: Asset[];
  evmAddress?: string;
  substrateAddress?: string;
}): Promise<TokenWithBalance[]> {
  const address = fromChain.isEvmChain ? evmAddress : substrateAddress;

  const tokens = await getTokensWithBalance({
    fromChain,
    toChain,
    assets,
    address,
    api: fromChainApi ?? undefined
  });

  return tokens;
}
