export const dynamic = 'force-dynamic';
import registry from '@/assets/registry.json';
import chainAssets from '@/assets/chains.json';
import assetsInfo from '@/assets/assets.json';
// import {
//   fetchPolkadotAssetRegistry,
//   fetchAssetsInfo,
//   fetchChainsInfo
// } from '@/services/fetch-chain-resources';
import Dashboard from './_components/dashboard';
import type { ChainConfig } from '@/types/asset-registry';
import type { ChainInfo } from '@/types/chains-info';
import type { Asset } from '@/types/assets-info';

export default async function Page() {
  // const [polkadotAsset, chainAssets, assetsInfo] = await Promise.all([
  //   fetchPolkadotAssetRegistry(),
  //   fetchChainsInfo(),
  //   fetchAssetsInfo()
  // ]);

  const polkadotAsset = registry?.polkadot;

  return (
    <Dashboard
      polkadotAssetRegistry={polkadotAsset as unknown as ChainConfig}
      chainsInfo={chainAssets as unknown as ChainInfo[]}
      assetsInfo={assetsInfo as unknown as Asset[]}
    />
  );
}
