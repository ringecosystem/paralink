import { fetchPolkadotAssetRegistry } from '@/services/fetch-asset-registry';
import Dashboard from './_components/dashboard';
import { fetchAssetsInfo, fetchChainsInfo } from '@/services/fetch-assets';

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
