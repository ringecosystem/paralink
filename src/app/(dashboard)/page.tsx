export const dynamic = 'force-dynamic';

import {
  fetchPolkadotAssetRegistry,
  fetchAssetsInfo,
  fetchChainsInfo
} from '@/services/fetch-chain-resources';
import Dashboard from './_components/dashboard';

export default async function Page() {
  const [polkadotAsset, chainAssets, assetsInfo] = await Promise.all([
    fetchPolkadotAssetRegistry(),
    fetchChainsInfo(),
    fetchAssetsInfo()
  ]);
  return (
    <Dashboard
      polkadotAssetRegistry={polkadotAsset}
      chainsInfo={chainAssets}
      assetsInfo={assetsInfo}
    />
  );
}
