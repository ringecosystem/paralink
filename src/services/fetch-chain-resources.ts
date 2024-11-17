'use server';
import { API_CACHE_TIME } from '@/config/cache';
import registry from '@/assets/registry.json';
import { createJsonResourceLoader } from '@/utils/resource-loader';
import chains from '@/assets/chains.json';
import assets from '@/assets/assets.json';
import type { ChainInfo } from '@/types/chains-info';
import type { Asset } from '@/types/assets-info';
import type { ChainConfig, Registry } from '@/types/asset-registry';

const CHAIN_INFO_CDN = 'https://content.subwallet.app/api/list/chain';
const CHAIN_INFO_GITHUB =
  'https://raw.githubusercontent.com/Koniverse/SubWallet-ChainList/refs/heads/master/packages/chain-list/src/data/ChainInfo.json';
const ASSETS_CDN = 'https://content.subwallet.app/api/list/chain-asset';
const ASSETS_GITHUB =
  'https://raw.githubusercontent.com/Koniverse/SubWallet-ChainList/refs/heads/master/packages/chain-list/src/data/ChainAsset.json';

const jsonLoader = createJsonResourceLoader({
  preferredCDN: 'github-raw'
});

export async function createAssetRegistryService() {
  async function getAssetRegistry() {
    return jsonLoader.fetchJson({
      owner: 'paritytech',
      repo: 'asset-transfer-api-registry',
      branch: 'main',
      path: 'docs/registry.json'
    });
  }

  return {
    getAssetRegistry
  };
}

async function fetchResource<T>(options: {
  cdnUrl: string;
  githubUrl: string;
  resourceLoader: {
    owner: string;
    repo: string;
    branch: string;
    path: string;
  };
  localFallback: T;
}): Promise<T> {
  // cdn fetch
  try {
    const res = await fetch(options.cdnUrl, {
      next: { revalidate: API_CACHE_TIME }
    });
    if (res.ok) return await res.json();
  } catch (error) {
    console.warn(`CDN fetch failed (${options.cdnUrl}):`, error);
  }

  // github fetch
  try {
    const data = await jsonLoader.fetchJson<T>(options.resourceLoader);
    return data;
  } catch (error) {
    console.warn('GitHub fetch failed:', error);
  }

  // local fallback
  console.warn('Falling back to local data');
  return options.localFallback;
}

export async function fetchPolkadotAssetRegistry(): Promise<ChainConfig> {
  try {
    const assetRegistryService = await createAssetRegistryService();
    const remoteRegistry =
      (await assetRegistryService.getAssetRegistry()) as Registry;
    return remoteRegistry?.polkadot as ChainConfig;
  } catch (error) {
    console.warn(
      'Failed to fetch remote registry, falling back to local registry:',
      error
    );
    return registry?.polkadot as unknown as ChainConfig;
  }
}

export async function fetchChainsInfo(): Promise<ChainInfo[]> {
  return fetchResource<ChainInfo[]>({
    cdnUrl: CHAIN_INFO_CDN,
    githubUrl: CHAIN_INFO_GITHUB,
    resourceLoader: {
      owner: 'Koniverse',
      repo: 'SubWallet-ChainList',
      branch: 'master',
      path: 'packages/chain-list/src/data/ChainInfo.json'
    },
    localFallback: chains as ChainInfo[]
  });
}

export async function fetchAssetsInfo(): Promise<Asset[]> {
  return fetchResource<Asset[]>({
    cdnUrl: ASSETS_CDN,
    githubUrl: ASSETS_GITHUB,
    resourceLoader: {
      owner: 'Koniverse',
      repo: 'SubWallet-ChainList',
      branch: 'master',
      path: 'packages/chain-list/src/data/ChainAsset.json'
    },
    localFallback: assets as Asset[]
  });
}
