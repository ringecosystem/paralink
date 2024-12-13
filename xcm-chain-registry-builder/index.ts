import fs from 'fs-extra';
import path from 'path';
import { isFunction } from '@polkadot/util';
import { ChainRegistry, ReserveType } from './type';
import {
  connectToChain,
  determineReserveType,
  getGeneralIndex,
  getValidWssEndpoints,
  hasParachainInLocation
} from './utils/helper';
import { findIconBySymbol } from './utils/find-icon-by-symbol';
import { ApiPromise } from '@polkadot/api';
import ss58 from '@substrate/ss58-registry';
import {
  fetchPolkadotAssetRegistry,
  fetchChainsInfo,
  fetchAssetsInfo
} from './service';
import { filterHrmpConnections } from './utils/hrmp-validation';
import { getSupportedParaChains } from './utils/get-supported-parachains';
import { SUPPORTED_XCM_PARA_IDS } from './config';
import { filterXcmTokensByString } from './utils/filter';
import { isSameLocation } from './utils/location';

async function buildChainRegistry({
  supportedParaChains,
  chainsInfoArray,
  assetsInfoArray
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
        xcAssetsData: chain?.xcAssetsData?.filter(asset => !asset?.xcmV1MultiLocation?.toLowerCase()?.includes('globalconsensus')),
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

  const validateChain = async (chain: (typeof supportedChains)[0]) => {
    if (SUPPORTED_XCM_PARA_IDS.includes(Number(chain.id))) {
      return chain;
    }
    const validProviders = getValidWssEndpoints(chain.providers);
    if (!validProviders.length) {
      console.warn(`No valid WebSocket endpoints found for chain ${chain.id}`);
      return null;
    }
    let api: ApiPromise | null = null;

    try {
      api = await connectToChain(validProviders);
      const hasXcmPayment = typeof api?.call?.xcmPaymentApi !== 'undefined';
      return hasXcmPayment ? chain : null;
    } catch (error) {
      console.error(`Error validating chain ${chain.id}:`, error);
      return null;
    } finally {
      if (api) {
        try {
          await api.disconnect();
        } catch (error) {
          console.error(`Error disconnecting from chain ${chain.id}:`, error);
        }
      }
    }
  };
  const validatedChains = (
    await Promise.all(supportedChains?.map(validateChain))
  )?.filter((v): v is NonNullable<typeof v> => !!v);

  return validatedChains;
}

async function transformChainRegistry({ originalChainRegistry, assetsInfoArray }) {
  const registry: ChainRegistry = {};
  const availableParachainIds: number[] = [0, ...originalChainRegistry?.map(chain => chain.id)?.map(Number)];
  let filteredChainRegistry: any[] = [];
  console.log('availableParachainIds', availableParachainIds);

  for (const chainEntry of originalChainRegistry) {
    const filteredXcmAssets = chainEntry?.xcAssetsData?.filter(
      xcmAsset => availableParachainIds?.includes(xcmAsset?.paraID)
    );

    filteredChainRegistry.push({
      ...chainEntry,
      xcAssetsData: filteredXcmAssets
    });
  }

  for (const chain of filteredChainRegistry) {
    const chainId = chain.id;
    const isAssetHub = chainId === '1000';
    registry[chainId] = {};
    registry[chainId].name = chain.name;
    registry[chainId].slug = chain.extraInfo?.subscanSlug;
    registry[chainId].icon = chain.icon;
    registry[chainId].addressPrefix = chain.substrateInfo.addressPrefix;
    registry[chainId].providers = getValidWssEndpoints(chain.providers);
    registry[chainId].alive = chain.chainStatus === 'ACTIVE';
    registry[chainId].existentialDeposit =
      chain.substrateInfo.existentialDeposit;

    registry[chainId].assetsType = null;
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

        const tokenXcm: any = await api.call.xcmPaymentApi.queryAcceptablePaymentAssets(3);
        const xcmTokens = tokenXcm.toJSON()?.ok || [];
        if (xcmTokens.length) {
          registry[chainId].xcmPaymentAcceptTokens = filterXcmTokensByString(xcmTokens, availableParachainIds);
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
      registeredChains: null
    };

    if (isAssetHub) {
      registry[chainId].localAssets = {};
      const assetGroups: { [assetId: string]: any } = {};

      filteredChainRegistry
        ?.filter((v) => v.id !== '1000')
        ?.forEach((v) => {
          const targetParaId = v?.id;
          if (!targetParaId) return;

          const destAssetsInfo = v.xcAssetsData?.filter((asset) => {
            const hasParachain = hasParachainInLocation({
              multiLocationStr: asset.xcmV1MultiLocation,
              paraId: '1000'
            });
            if (!hasParachain) return false;
            const generalIndex = getGeneralIndex(asset.xcmV1MultiLocation);
            if (!generalIndex) return false;
            return Object.keys(chain.assetsInfo || {}).includes(generalIndex);
          });

          if (destAssetsInfo && destAssetsInfo.length > 0) {
            destAssetsInfo.forEach((asset) => {
              const generalIndex = getGeneralIndex(asset.xcmV1MultiLocation);
              if (!generalIndex) return;

              const assetInfo = chain.assetsInfo?.[generalIndex || ''];

              if (!assetGroups[generalIndex]) {
                assetGroups[generalIndex] = {
                  assetId: generalIndex,
                  symbol: assetInfo || asset.symbol,
                  decimals: asset.decimals,
                  registeredChains: {}
                };
              }
              assetGroups[generalIndex].registeredChains[targetParaId] = {
                assetId: asset.asset,
                symbol: asset.symbol,
                decimals: asset.decimals,
                isNative: false,
                reserveType: ReserveType.Local,
                icon: findIconBySymbol(
                  assetInfo || asset.symbol,
                  assetsInfoArray
                ),
                xcmLocation: {
                  v1: {
                    parents: 0,
                    interior: {
                      x3: [
                        {
                          parachain: Number(chain.id)
                        },
                        { palletInstance: 50 },
                        { generalIndex: generalIndex }
                      ]
                    }
                  }
                }
              };
            });
          }
        });
      registry[chainId].localAssets = assetGroups;
    } else {
      // 处理非AssetHub链的localAssets
      registry[chainId].localAssets = {};
      const assetGroups: { [assetId: string]: any } = {};

      // 找出当前链的本地资产
      const currentChainAssets = chain.xcAssetsData?.filter(asset =>
        asset.paraID?.toString() === chainId
      );

      if (currentChainAssets?.length) {
        currentChainAssets.forEach(localAsset => {
          const assetId = localAsset.asset;
          const localAssetLocation = localAsset.xcmV1MultiLocation;

          // 初始化资产组
          if (!assetGroups[assetId]) {
            assetGroups[assetId] = {
              assetId: assetId,
              symbol: localAsset.symbol,
              decimals: localAsset.decimals,
              registeredChains: {},
              xcmLocation: JSON.parse(localAssetLocation) // 保存原始location用于比较
            };
          }

          // 查找其他链对这个资产的引用
          filteredChainRegistry
            ?.filter(v => v.id !== chainId)
            ?.forEach(otherChain => {
              const registeredAsset = otherChain.xcAssetsData?.find(asset => {
                // 使用isSameLocation比较XCM位置
                return isSameLocation(asset.xcmV1MultiLocation, localAssetLocation) ||
                  (hasParachainInLocation({
                    multiLocationStr: asset.xcmV1MultiLocation,
                    paraId: chainId
                  }) &&
                    asset.symbol.toLowerCase() === localAsset.symbol.toLowerCase());
              });

              if (registeredAsset) {
                assetGroups[assetId].registeredChains[otherChain.id] = {
                  assetId: registeredAsset.asset,
                  symbol: registeredAsset.symbol,
                  decimals: registeredAsset.decimals,
                  isNative: false,
                  reserveType: ReserveType.Local,
                  icon: findIconBySymbol(registeredAsset.symbol, assetsInfoArray),
                  xcmLocation: JSON.parse(registeredAsset.xcmV1MultiLocation)
                };
              }
            });
        });
      }

      registry[chainId].localAssets = assetGroups;



      filteredChainRegistry
        ?.filter((v) => v.id !== chainId)
        ?.forEach((v) => {

          const destAssetsInfo = v.xcAssetsData?.filter((asset) => {
            const hasParachain = hasParachainInLocation({
              multiLocationStr: asset.xcmV1MultiLocation,
              paraId: chainId
            }) && chain?.nativeToken?.symbol?.toLowerCase() === asset?.symbol?.toLowerCase()
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

      chain.xcAssetsData?.filter(asset => typeof asset?.paraID === 'number')?.forEach((asset: any) => {
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

  const transformedJson = await transformChainRegistry({
    originalChainRegistry: validatedChains,
    assetsInfoArray
  });

  fs.writeJson(
    path.join(__dirname, './dist/transformed-chain-registry.json'),
    transformedJson,
    { spaces: 2 }
  )
    .then(() => {
      console.log('Transformed chain registry file created successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to write transformed chain registry file:', err);
      process.exit(1);
    });
}

init();
