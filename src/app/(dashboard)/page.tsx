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

  console.log('polkadotAsset', polkadotAsset);
  console.log('chainAssets', chainAssets);
  console.log('assetsInfo', assetsInfo);

  return (
    <Dashboard
      polkadotAssetRegistry={polkadotAsset}
      chainsInfo={chainAssets}
      assetsInfo={assetsInfo}
    />
  );
}
