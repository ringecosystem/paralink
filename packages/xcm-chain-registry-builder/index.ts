import fs from 'fs-extra';
import path from 'path';
import {
  Asset,
  ChainInfo,
  ChainRegistry,
  ParaChainConfig
} from './types/registry';
import { ReserveType } from './types/enum';

import {
  connectToChain,
  getValidWssEndpoints
} from './utils/network/endpoints';
import {
  findIconBySymbol,
  filterXcmTokensByString,
  processAssetHubAssets,
  processAssetHubAssetsWithRegisteredChains,
  findNativeAssetBySymbol,
  findLocalAssetBySymbol,
  getChainByParaId
} from './utils/xcm/assets';
import { determineReserveType } from './utils/xcm/location';
import { getSupportedParaChains } from './utils/chain/parachain';
import {
  filterHrmpConnections,
  validateChains
} from './utils/chain/validation';
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
        (v) =>
          v.substrateInfo?.paraId?.toString() === chain.id ||
          (chain?.specName === 'polkadot' && v.slug === 'polkadot')
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

      const isPolkadot = chain?.specName === 'polkadot';

      const nativeAsset = findNativeAssetBySymbol({
        assets: assetsInfoArray,
        symbol: ss58Format?.symbols?.[0],
        chainSlug: chainAsset?.slug
      });

      return {
        ...chainAsset,
        substrateInfo: isPolkadot
          ? {
              ...(chainAsset?.substrateInfo || {}),
              paraId: 0
            }
          : chainAsset?.substrateInfo,
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
          name: nativeAsset?.name || ss58Format?.symbols?.[0],
          icon: nativeAsset?.icon || null,
          priceId: nativeAsset?.priceId || null,
          minAmount: nativeAsset?.minAmount || null,
          xcmLocation: nativeAsset?.metadata?.multilocation || null
        },
        isEvm:
          ss58Format?.standardAccount === 'secp256k1' && !!chainAsset?.evmInfo
      };
    })
    ?.filter((v): v is NonNullable<typeof v> => !!v);

  return await validateChains(
    supportedChains as unknown as ChainRegistryItem[]
  );
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
    const isPolkadot = chainId === '0';
    const isAssetHub = chainId === '1000';
    registry[chainId] = {
      name: chain.name,
      slug: chain.slug,
      icon: chain.icon,
      addressPrefix: chain.substrateInfo.addressPrefix,
      providers: getValidWssEndpoints(chain.providers),
      alive: chain.chainStatus === 'ACTIVE',
      existentialDeposit: chain.substrateInfo.existentialDeposit,
      isEvm: chain.isEvm,
      explorer: chain.isEvm
        ? chain.evmInfo?.blockExplorer
        : chain.substrateInfo.blockExplorer,
      evmChainId: chain.isEvm ? Number(chain.evmInfo?.evmChainId) : undefined
    };

    let api: ApiPromise | null = null;

    try {
      const validProviders = getValidWssEndpoints(chain.providers);
      if (validProviders.length) {
        api = await connectToChain(validProviders);

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

    registry[chainId].nativeToken = {
      ...(chain.nativeToken || {}),
      isNative: true,
      reserveType: ReserveType.Local,
      xcmLocation: chain?.nativeToken?.xcmLocation
        ? {
            v1: chain?.nativeToken?.xcmLocation
          }
        : isPolkadot || isAssetHub
          ? {
              v1: {
                parents: 1,
                interior: {
                  here: null
                }
              }
            }
          : {
              v1: {
                parents: 0,
                interior: {
                  here: null
                }
              }
            },
      registeredChains: null
    };

    const peerChains = filteredChainRegistry?.filter((v) => v.id !== chainId);

    if (isAssetHub) {
      const processedAssets = processAssetHubAssets(
        chain,
        peerChains,
        assetsInfoArray
      );
      const enhancedAssets = processAssetHubAssetsWithRegisteredChains(
        processedAssets,
        chain,
        peerChains,
        assetsInfoArray
      );

      if (registry[chainId]) {
        registry[chainId].localAssets = enhancedAssets;
      }
    } else {
      const processedAssets = chain.xcAssetsData
        ?.filter((asset) => asset.paraID === Number(chainId))
        ?.filter(
          (v) =>
            v.symbol.toLowerCase() !== chain.nativeToken.symbol.toLowerCase()
        );

      if (processedAssets && processedAssets.length > 0) {
        const localAssets = processedAssets.map((asset) => ({
          symbol: asset.symbol,
          decimals: asset.decimals,
          assetId: asset.asset,
          xcmLocation: JSON.parse(asset.xcmV1MultiLocation),
          reserveType: ReserveType.Local
        }));

        const enhancedLocalAssets = localAssets.map((asset) => {
          const localAsset = findLocalAssetBySymbol({
            assets: assetsInfoArray,
            chainSlug: chain.slug,
            symbol: asset.symbol
          });
          const registeredChains = {};
          peerChains?.forEach((peerChain) => {
            if (
              !peerChain.xcAssetsData ||
              peerChain.xcAssetsData.length === 0
            ) {
              return;
            }
            const matchedAsset = peerChain.xcAssetsData?.find(
              (xcAsset) =>
                xcAsset?.paraID === Number(chainId) &&
                xcAsset.symbol.toLowerCase() === asset.symbol.toLowerCase()
            );
            if (matchedAsset) {
              const targetAsset = findLocalAssetBySymbol({
                assets: assetsInfoArray,
                chainSlug: chain.slug,
                symbol: matchedAsset.symbol
              });
              registeredChains[peerChain.id] = {
                assetId: matchedAsset.asset,
                symbol: matchedAsset.symbol,
                name: targetAsset?.name || localAsset?.name,
                decimals: matchedAsset.decimals,
                minAmount: targetAsset?.minAmount,
                priceId: targetAsset?.priceId || localAsset?.priceId
              };
            }
          });

          return {
            ...asset,
            icon: localAsset?.icon,
            minAmount: localAsset?.minAmount,
            priceId: localAsset?.priceId,
            registeredChains
          };
        });
        registry[chainId].localAssets = enhancedLocalAssets;
      }

      filteredChainRegistry
        ?.filter((v) => v.id !== chainId)
        ?.forEach((v) => {
          const destAssetsInfo = v.xcAssetsData?.filter((asset) => {
            const hasParachain = Number(asset.paraID) === Number(chainId);
            return (
              hasParachain &&
              chain?.nativeToken?.symbol?.toLowerCase() ===
                asset?.symbol?.toLowerCase()
            );
          });

          if (destAssetsInfo && destAssetsInfo.length > 0) {
            destAssetsInfo?.forEach((asset) => {
              if (
                registry?.[chainId]?.nativeToken &&
                !registry?.[chainId]?.nativeToken?.registeredChains
              ) {
                registry[chainId].nativeToken.registeredChains = {};
              }

              const targetAsset = findLocalAssetBySymbol({
                assets: assetsInfoArray,
                chainSlug: chain.slug,
                symbol: asset.symbol
              });
              if (registry?.[chainId]?.nativeToken?.registeredChains) {
                registry[chainId].nativeToken.registeredChains[v.id] = {
                  assetId: asset.asset,
                  symbol: asset.symbol,
                  name: targetAsset?.name || asset.symbol,
                  decimals: asset.decimals,
                  minAmount: targetAsset?.minAmount,
                  priceId: targetAsset?.priceId || chain?.nativeToken?.priceId,
                  isNative: true,
                  reserveType: ReserveType.Local,
                  icon: findIconBySymbol(asset.symbol, assetsInfoArray),
                  xcmLocation: JSON.parse(asset.xcmV1MultiLocation)
                };
              }
            });
          } else if (chainId === '0' && v.id === '1000') {
            if (
              registry?.[chainId]?.nativeToken &&
              !registry?.[chainId]?.nativeToken?.registeredChains
            ) {
              registry[chainId].nativeToken.registeredChains = {};
            }
            const targetAsset = findLocalAssetBySymbol({
              assets: assetsInfoArray,
              chainSlug: chain.slug,
              symbol: chain.nativeToken.symbol
            });
            if (registry?.[chainId]?.nativeToken?.registeredChains) {
              registry[chainId].nativeToken.registeredChains[v.id] = {
                symbol: chain.nativeToken.symbol,
                name: targetAsset?.name || chain.nativeToken.symbol,
                decimals: chain.nativeToken.decimals,
                minAmount: targetAsset?.minAmount,
                priceId: targetAsset?.priceId || chain?.nativeToken?.priceId,
                isNative: true,
                reserveType: ReserveType.Local,
                icon: chain.nativeToken.icon,
                xcmLocation: {
                  v1: {
                    parents: 1,
                    interior: {
                      here: null
                    }
                  }
                },
                assetId: 'Native'
              };
            }
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
          const currentAsset =
            chain?.nativeToken?.symbol === asset?.symbol
              ? findNativeAssetBySymbol({
                  assets: assetsInfoArray,
                  symbol: asset.symbol,
                  chainSlug: chain.slug
                })
              : findLocalAssetBySymbol({
                  assets: assetsInfoArray,
                  chainSlug: chain.slug,
                  symbol: asset.symbol
                });

          const chainInArray = getChainByParaId({
            paraId,
            chainRegistry: peerChains
          });

          const sourceAsset =
            chainInArray?.nativeToken?.symbol === asset?.symbol
              ? findNativeAssetBySymbol({
                  assets: assetsInfoArray,
                  chainSlug: chainInArray?.slug,
                  symbol: asset.symbol
                })
              : findLocalAssetBySymbol({
                  assets: assetsInfoArray,
                  chainSlug: chainInArray?.slug || '',
                  symbol: asset.symbol
                });

          groupedAssets[paraId].push({
            assetId: asset.asset,
            symbol: asset.symbol,
            name: currentAsset?.name || sourceAsset?.name || asset.symbol,
            decimals: asset.decimals,
            xcmLocation: xcmLocation,
            minAmount: currentAsset?.minAmount,
            priceId: currentAsset?.priceId || sourceAsset?.priceId,
            reserveType: determineReserveType({
              sourceParaId: chainId,
              targetParaId: paraId,
              originChainReserveLocation: asset.originChainReserveLocation
            }),
            icon: currentAsset?.icon || sourceAsset?.icon
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
  const assetsInfoArray = Object.entries(assetsInfo)?.map(([key, asset]) => ({
    ...asset,
    id: key
  }));

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
  const storeBasePath = path.join(
    envBasePath ? envBasePath : __dirname,
    'output'
  );
  if (!(await fs.exists(storeBasePath))) {
    await fs.mkdirp(storeBasePath);
  }
  const registryPath = path.join(storeBasePath, 'registry.json');
  fs.writeJson(registryPath, validatedChains, { spaces: 2 })
    .then(() => {
      console.log('Validated chain registry file created successfully!');
    })
    .catch((err) => {
      console.error('Failed to write validated chain registry file:', err);
    });

  const transformedJson = await transformChainRegistry({
    originalChainRegistry: validatedChains,
    assetsInfoArray
  });

  const transformedPath = path.join(
    storeBasePath,
    'transformed-chain-registry.json'
  );
  fs.writeJson(transformedPath, transformedJson, { spaces: 2 })
    .then(() => {
      console.log(
        'Transformed chain registry file created successfully!',
        transformedPath
      );
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to write transformed chain registry file:', err);
      process.exit(1);
    });
}

init();
