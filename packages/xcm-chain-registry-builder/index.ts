import fs from 'fs-extra';
import path from 'path';
import { isFunction } from '@polkadot/util';
import { Asset, ChainInfo, ChainRegistry, ParaChainConfig, } from './types/registry';
import { ReserveType } from './types/enum';

import {
  connectToChain,
  getValidWssEndpoints,
} from './utils/network/endpoints';
import { findIconBySymbol, filterXcmTokensByString, processAssetHubAssets, processAssetHubAssetsWithRegisteredChains } from './utils/xcm/assets';
import {
  determineReserveType,
  hasParachainInLocation
} from './utils/xcm/location';
import { getSupportedParaChains } from './utils/chain/parachain';
import { filterHrmpConnections, validateChains } from './utils/chain/validation';
import { ApiPromise } from '@polkadot/api';
import ss58 from '@substrate/ss58-registry';
import {
  fetchPolkadotAssetRegistry,
  fetchChainsInfo,
  fetchAssetsInfo
} from './service';
import { ChainRegistry as ChainRegistryItem } from './types/transformParachains';

async function buildChainRegistry({
  supportedParaChains,
  chainsInfoArray,
  assetsInfoArray
}: {
  supportedParaChains: ParaChainConfig[];
  chainsInfoArray: ChainInfo[];
  assetsInfoArray: Asset[];
}) {
  const supportedChains = supportedParaChains
    ?.map((chain) => {
      const chainAsset = chainsInfoArray?.find(
        (v) => v.substrateInfo?.paraId?.toString() === chain.id
      );
      const ss58Format = ss58.find(
        (v) => v.prefix === chainAsset?.substrateInfo?.addressPrefix
      );

      if (!chainAsset) {
        console.warn(`Chain asset not found for chain ID: ${chain.id}`);
        return null;
      }

      if (!ss58Format?.symbols?.[0] || !ss58Format?.decimals?.[0]) {
        console.warn(`Invalid ss58 format for chain ID: ${chain.id}`);
        return null;
      }

      return {
        ...chainAsset,
        id: chain?.id?.toString(),
        assetsInfo: chain?.assetsInfo,
        xcAssetsData: chain?.xcAssetsData?.filter(
          (asset) =>
            !asset?.xcmV1MultiLocation
              ?.toLowerCase()
              ?.includes('globalconsensus')
        ),
        nativeToken: {
          symbol: ss58Format?.symbols?.[0],
          decimals: ss58Format?.decimals?.[0],
          icon: findIconBySymbol(ss58Format?.symbols?.[0], assetsInfoArray)
        },
        isEvm:
          ss58Format?.standardAccount === 'secp256k1' && !!chainAsset?.evmInfo
      };
    })
    ?.filter((v): v is NonNullable<typeof v> => !!v);

  return await validateChains(supportedChains as unknown as ChainRegistryItem[]);
}

async function transformChainRegistry({
  originalChainRegistry,
  assetsInfoArray
}) {
  const registry: ChainRegistry = {};
  const availableParachainIds: number[] = [
    0,
    ...(originalChainRegistry?.map((chain) => chain.id)?.map(Number) || [])
  ];
  const filteredChainRegistry: any[] = [];
  console.log('availableParachainIds', availableParachainIds);

  for (const chainEntry of originalChainRegistry) {
    const filteredXcmAssets = chainEntry?.xcAssetsData?.filter((xcmAsset) =>
      availableParachainIds?.includes(xcmAsset?.paraID)
    );

    filteredChainRegistry.push({
      ...chainEntry,
      xcAssetsData: filteredXcmAssets
    });
  }

  for (const chain of filteredChainRegistry) {
    const chainId = chain.id;
    const isAssetHub = chainId === '1000';
    registry[chainId] = {
      name: chain.name,
      slug: chain.extraInfo?.subscanSlug,
      icon: chain.icon,
      addressPrefix: chain.substrateInfo.addressPrefix,
      providers: getValidWssEndpoints(chain.providers),
      alive: chain.chainStatus === 'ACTIVE',
      existentialDeposit: chain.substrateInfo.existentialDeposit,
      assetsType: null,
    };


    let api: ApiPromise | null = null;

    try {
      const validProviders = getValidWssEndpoints(chain.providers);
      if (validProviders.length) {
        api = await connectToChain(validProviders);
        if (isFunction(api.query.assets?.account)) {
          registry[chainId].assetsType = 'assets';
        } else if (isFunction(api.query.tokens?.accounts)) {
          registry[chainId].assetsType = 'tokens';
        }

        const tokenXcm: any =
          await api.call.xcmPaymentApi.queryAcceptablePaymentAssets(3);
        const xcmTokens = tokenXcm.toJSON()?.ok || [];
        if (xcmTokens.length) {
          registry[chainId].xcmPaymentAcceptTokens = filterXcmTokensByString(
            xcmTokens,
            availableParachainIds
          );
        }
      }
    } catch (error) {
      console.error(`Error checking assets type for chain ${chainId}:`, error);
    } finally {
      if (api) {
        try {
          await api.disconnect();
        } catch (error) {
          console.error(`Error disconnecting from chain ${chainId}:`, error);
        }
      }
    }

    registry[chainId].isEvm = chain.isEvm;
    registry[chainId].explorer = chain.isEvm
      ? chain.evmInfo?.blockExplorer
      : chain.substrateInfo.blockExplorer;
    registry[chainId].evmChainId = chain.isEvm
      ? Number(chain.evmInfo?.evmChainId)
      : undefined;
    registry[chainId].nativeToken = {
      symbol: chain.nativeToken.symbol,
      decimals: chain.nativeToken.decimals,
      icon: chain.nativeToken.icon,
      isNative: true,
      reserveType: ReserveType.Local,
      xcmLocation: {
        v1: {
          parents: 0,
          interior: {
            here: null
          }
        }
      },
      registeredChains: null
    };


    const peerChains = filteredChainRegistry?.filter((v) => v.id !== chainId)

    if (isAssetHub) {
      const processedAssets = processAssetHubAssets(chain, peerChains, assetsInfoArray);
      const enhancedAssets = processAssetHubAssetsWithRegisteredChains(processedAssets, peerChains);
      if (registry[chainId]) {
        registry[chainId].localAssets = enhancedAssets;
      }
    } else {
      const processedAssets = chain.xcAssetsData?.filter(
        (asset) => asset.paraID === Number(chainId)
      )?.filter(v => v.symbol.toLowerCase() !== chain.nativeToken.symbol.toLowerCase())

      if (processedAssets && processedAssets.length > 0) {
        const localAssets = processedAssets.map(asset => ({
          symbol: asset.symbol,
          decimals: asset.decimals,
          assetId: asset.asset,
          icon: findIconBySymbol(asset.symbol, assetsInfoArray),
          xcmLocation: JSON.parse(asset.xcmV1MultiLocation),
          reserveType: ReserveType.Local,
        }));

        const enhancedLocalAssets = localAssets.map(asset => {
          const registeredChains = {};
          peerChains
            ?.forEach(peerChain => {
              if (!peerChain.xcAssetsData || peerChain.xcAssetsData.length === 0) {
                return;
              }
              const matchedAsset = peerChain.xcAssetsData?.find(xcAsset =>
                xcAsset.symbol.toLowerCase() === asset.symbol.toLowerCase() &&
                hasParachainInLocation({
                  multiLocationStr: JSON.stringify(xcAsset.xcmV1MultiLocation),
                  paraId: chainId
                })
              );
              if (matchedAsset) {
                registeredChains[peerChain.id] = {
                  assetId: matchedAsset.asset,
                  symbol: matchedAsset.symbol,
                  decimals: matchedAsset.decimals,
                };
              }
            });

          return {
            ...asset,
            registeredChains
          };
        });
        registry[chainId].localAssets = enhancedLocalAssets;
      }




      filteredChainRegistry
        ?.filter((v) => v.id !== chainId)
        ?.forEach((v) => {
          const destAssetsInfo = v.xcAssetsData?.filter((asset) => {
            const hasParachain =
              hasParachainInLocation({
                multiLocationStr: asset.xcmV1MultiLocation,
                paraId: chainId
              }) &&
              chain?.nativeToken?.symbol?.toLowerCase() ===
              asset?.symbol?.toLowerCase();
            return hasParachain;
          });

          if (destAssetsInfo && destAssetsInfo.length > 0) {
            destAssetsInfo?.forEach((asset) => {
              if (
                registry?.[chainId]?.nativeToken &&
                !registry?.[chainId]?.nativeToken?.registeredChains
              ) {
                registry[chainId].nativeToken.registeredChains = {};
              }
              if (registry?.[chainId]?.nativeToken?.registeredChains) {
                registry[chainId].nativeToken.registeredChains[v.id] = {
                  assetId: asset.asset,
                  symbol: asset.symbol,
                  decimals: asset.decimals,
                  isNative: true,
                  reserveType: ReserveType.Local,
                  icon: findIconBySymbol(asset.symbol, assetsInfoArray),
                  xcmLocation: JSON.parse(asset.xcmV1MultiLocation)
                };
              }
            });
          }
        });

      const groupedAssets: { [key: string]: any[] } = {};

      chain.xcAssetsData
        ?.filter((asset) => typeof asset?.paraID === 'number')
        ?.forEach((asset: any) => {
          const paraId = asset.paraID;
          if (!groupedAssets[paraId]) {
            groupedAssets[paraId] = [];
          }

          const xcmLocation = JSON.parse(asset.xcmV1MultiLocation);

          groupedAssets[paraId].push({
            assetId: asset.asset,
            symbol: asset.symbol,
            decimals: asset.decimals,
            xcmLocation: xcmLocation,
            reserveType: determineReserveType({
              sourceParaId: chainId,
              targetParaId: paraId,
              originChainReserveLocation: asset.originChainReserveLocation
            }),
            icon: findIconBySymbol(asset.symbol, assetsInfoArray)
          });
        });

      registry[chainId].xcAssetsData = groupedAssets;
    }
  }
  return registry;
}

async function init() {
  const polkadotAssetRegistry = await fetchPolkadotAssetRegistry();
  const chainsInfo = await fetchChainsInfo();
  const assetsInfo = await fetchAssetsInfo();
  if (!polkadotAssetRegistry || !chainsInfo || !assetsInfo) {
    console.error('polkadotAssetRegistry or chainsInfo is not found');
    return;
  }
  const chainsInfoArray = Object.values(chainsInfo);
  const assetsInfoArray = Object.values(assetsInfo);
  if (!polkadotAssetRegistry || !chainsInfo || !assetsInfo) {
    console.error('polkadotAssetRegistry or chainsInfo is not found');
    return;
  }
  const filteredPolkadotAssetRegistry = await filterHrmpConnections({
    polkadotAssetRegistry,
    chainsInfo: chainsInfoArray
  });
  const supportedParaChains = getSupportedParaChains(
    filteredPolkadotAssetRegistry
  );
  const validatedChains = await buildChainRegistry({
    supportedParaChains,
    chainsInfoArray,
    assetsInfoArray
  });
  const envBasePath = process.env.STORE_BASE_PATH;
  const storeBasePath = path.join(envBasePath ? envBasePath : __dirname, 'output');
  if (!await fs.exists(storeBasePath)) {
    await fs.mkdirp(storeBasePath);
  }
  const registryPath = path.join(storeBasePath, 'registry.json');
  fs.writeJson(
    registryPath,
    validatedChains,
    { spaces: 2 }
  )
    .then(() => {
      console.log('Validated chain registry file created successfully!', );
    })
    .catch((err) => {
      console.error('Failed to write validated chain registry file:', err);
    });


  const transformedJson = await transformChainRegistry({
    originalChainRegistry: validatedChains,
    assetsInfoArray
  });

  const transformedPath = path.join(storeBasePath, 'transformed-chain-registry.json');
  fs.writeJson(
    transformedPath,
    transformedJson,
    { spaces: 2 }
  )
    .then(() => {
      console.log('Transformed chain registry file created successfully!', transformedPath);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to write transformed chain registry file:', err);
      process.exit(1);
    });
}

init();
