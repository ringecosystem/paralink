import { createJsonResourceLoader } from './utils/resource-loader';
import type { ChainInfo, Asset, ChainConfig, Registry } from './types/registry';

const CHAIN_INFO_CDN = 'https://content.subwallet.app/api/list/chain';
const ASSETS_CDN = 'https://content.subwallet.app/api/list/chain-asset';

export async function createAssetRegistryService() {
    async function getAssetRegistry() {
        const jsonLoader = createJsonResourceLoader({
            preferredCDN: 'github-raw'
        });
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
    resourceLoader: {
        owner: string;
        repo: string;
        branch: string;
        path: string;
    };
}): Promise<T | undefined> {
    // cdn fetch
    // try {
    //     const res = await fetch(options.cdnUrl);
    //     if (res.ok) return await res.json();
    // } catch (error) {
    //     console.warn(`CDN fetch failed (${options.cdnUrl}):`, error);
    // }

    // github fetch
    try {
        const jsonLoader = createJsonResourceLoader({
            preferredCDN: 'github-raw'
        });

        const data = await jsonLoader.fetchJson<T>(options.resourceLoader);
        return data;
    } catch (error) {
        console.warn('GitHub fetch failed:', error);
    }

    // local fallback
    console.warn('Falling back to local data');
    return undefined;
}

export async function fetchPolkadotAssetRegistry(): Promise<ChainConfig | undefined> {
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
    }
}

export async function fetchChainsInfo(): Promise<ChainInfo[] | undefined> {
    return fetchResource<ChainInfo[]>({
        cdnUrl: CHAIN_INFO_CDN,
        resourceLoader: {
            owner: 'Koniverse',
            repo: 'SubWallet-ChainList',
            branch: 'master',
            path: 'packages/chain-list/src/data/ChainInfo.json'
        },
    });
}

export async function fetchAssetsInfo(): Promise<Asset[] | undefined> {
    return fetchResource<Asset[]>({
        cdnUrl: ASSETS_CDN,
        resourceLoader: {
            owner: 'Koniverse',
            repo: 'SubWallet-ChainList',
            branch: 'master',
            path: 'packages/chain-list/src/data/ChainAsset.json'
        },
    });
}
