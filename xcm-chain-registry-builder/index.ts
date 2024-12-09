import fs from 'fs-extra';
import path from 'path';
// import ss58 from '@substrate/ss58-registry';
// import { fetchPolkadotAssetRegistry, fetchChainsInfo, fetchAssetsInfo } from './service';
// import { filterHrmpConnections } from './utils/hrmp-validation';
// import { getSupportedParaChains } from './utils/get-supported-parachains';
// import { SUPPORTED_XCM_PARA_IDS } from './config';
// import { ApiPromise, WsProvider } from '@polkadot/api';
// import { findIconBySymbol } from './utils/find-icon-by-symbol';
// import { getValidWssEndpoints } from './utils/helper';

// async function buildChainRegistry() {
//     const polkadotAssetRegistry = await fetchPolkadotAssetRegistry();
//     const chainsInfo = await fetchChainsInfo();
//     const assetsInfo = await fetchAssetsInfo();

//     if (!polkadotAssetRegistry || !chainsInfo || !assetsInfo) {
//         console.error('polkadotAssetRegistry or chainsInfo is not found');
//         return;
//     }
//     const chainsInfoArray = Object.values(chainsInfo);
//     const assetsInfoArray = Object.values(assetsInfo);

//     const filteredPolkadotAssetRegistry = await filterHrmpConnections({
//         polkadotAssetRegistry,
//         chainsInfo: chainsInfoArray
//     });

//     const supportedParaChains = getSupportedParaChains(filteredPolkadotAssetRegistry);

//     const supportedChains = supportedParaChains
//         ?.map((chain) => {
//             const chainAsset = chainsInfoArray?.find(
//                 (v) => v.substrateInfo?.paraId?.toString() === chain.id
//             );
//             const ss58Format = ss58.find(
//                 (v) => v.prefix === chainAsset?.substrateInfo?.addressPrefix
//             );

//             if (!chainAsset) {
//                 console.warn(`Chain asset not found for chain ID: ${chain.id}`);
//                 return null;
//             }

//             if (!ss58Format?.symbols?.[0] || !ss58Format?.decimals?.[0]) {
//                 console.warn(`Invalid ss58 format for chain ID: ${chain.id}`);
//                 return null;
//             }

//             return {
//                 ...chainAsset,
//                 id: chain?.id?.toString(),
//                 assetsInfo: chain?.assetsInfo,
//                 xcAssetsData: chain?.xcAssetsData,
//                 nativeToken: {
//                     symbol: ss58Format?.symbols?.[0],
//                     decimals: ss58Format?.decimals?.[0],
//                     icon: findIconBySymbol(ss58Format?.symbols?.[0], assetsInfoArray)
//                 },
//                 isEvmChain:
//                     ss58Format?.standardAccount === 'secp256k1' &&
//                     !!chainAsset?.evmInfo
//             };
//         })
//         ?.filter((v): v is NonNullable<typeof v> => !!v);

//     const validateChain = async (chain: (typeof supportedChains)[0]) => {
//         if (SUPPORTED_XCM_PARA_IDS.includes(Number(chain.id))) {
//             return chain;
//         }
//         const validProviders = getValidWssEndpoints(chain.providers);
//         if (!validProviders.length) {
//             console.warn(
//                 `No valid WebSocket endpoints found for chain ${chain.id}`
//             );
//             return null;
//         }
//         try {
//             const provider = new WsProvider(validProviders, 5_000);
//             const api = await ApiPromise.create({ provider, noInitWarn: true, throwOnConnect: true });
//             const hasXcmPayment = typeof api?.call?.xcmPaymentApi !== 'undefined';
//             await api.disconnect();

//             return hasXcmPayment ? chain : null;
//         } catch (error) {
//             console.error(`Error validating chain ${chain.id}:`, error);
//             return null;
//         }
//     };
//     const validatedChains = (
//         await Promise.all(supportedChains?.map(validateChain))
//     )?.filter((v): v is NonNullable<typeof v> => !!v);

//     console.log('validatedChains', validatedChains);

//     if (validatedChains && validatedChains.length > 0) {

//         try {
//             await fs.ensureDir(path.join(__dirname, './dist'));

//             await fs.writeJson(
//                 path.join(__dirname, './dist/chain-registry.json'),
//                 {chains: validatedChains},
//                 { spaces: 2 }
//             );

//             console.log('Chain registry file created successfully!');
//         } catch (err) {
//             console.error('Failed to write chain registry file:', err);
//         }
//     } else {
//         console.warn('No validated chains found, skipping file creation.');
//     }
// }

// buildChainRegistry();


function transformChainRegistry(originalJson: any) {
    const transformedData: any = {};

    for (const chain of originalJson) {
        const chainId = chain.id;
        const isAssetHub = chainId === "1000";

        // 处理 native token 的 registeredChains
        const nativeTokenRegisteredChains = {};
        if (chain.xcAssetsData) {
            chain.xcAssetsData.forEach(asset => {
                // 如果是 Asset Hub，需要特殊处理
                if (isAssetHub) {
                    if (asset.paraID && asset.palletInstance === 50) {
                        nativeTokenRegisteredChains[asset.paraID] = {
                            assetId: asset.asset,
                            xcmLocation: asset.xcmV1MultiLocation
                        };
                    }
                } else {
                    // 对于其他链，查找其 native token 在其他链的注册情况
                    if (asset.paraID && asset.symbol === chain.nativeToken.symbol) {
                        nativeTokenRegisteredChains[asset.paraID] = {
                            assetId: asset.asset,
                            xcmLocation: asset.xcmV1MultiLocation
                        };
                    }
                }
            });
        }

        // 构建新的数据结构
        transformedData[chainId] = {
            explorer: chain.substrateInfo?.blockExplorer || chain.extraInfo?.subscanSlug,
            providers: chain.providers,
            alive: chain.chainStatus === "ACTIVE",
            // Asset Hub 特殊处理
            assetsType: isAssetHub ? "assets" : "tokens",
            isEvm: chain.isEvmChain,
            evmInfo: chain.isEvmChain ? {
                evmChainId: chain.evmInfo?.evmChainId,
                blockExplorer: chain.evmInfo?.blockExplorer
            } : null,
            nativeToken: {
                symbol: chain.nativeToken?.symbol,
                decimals: chain.nativeToken?.decimals,
                icon: chain.nativeToken?.icon,
                registeredChains: nativeTokenRegisteredChains
            },
            xcAssetData: transformXcAssetsData(chain.xcAssetsData, chainId)
        };
    }

    return transformedData;
}

// 转换 xcAssetsData，增加对 Asset Hub 的特殊处理
function transformXcAssetsData(xcAssetsData: any[], chainId: string) {
    if (!xcAssetsData) return {};

    const result = {};
    const isAssetHub = chainId === "1000";

    xcAssetsData.forEach(asset => {
        if (!asset.paraID) return;

        const paraId = asset.paraID.toString();

        if (!result[paraId]) {
            result[paraId] = [];
        }

        // Asset Hub 特殊处理
        const assetEntry = {
            assetId: asset.asset,
            symbol: asset.symbol,
            decimals: asset.decimals,
            xcmLocation: asset.xcmV1MultiLocation,
            icon: null // 需要从其他地方获取 icon 信息
        };

        // 如果是 Asset Hub，添加额外信息
        if (isAssetHub) {
            Object.assign(assetEntry, {
                palletInstance: asset.palletInstance,
                generalIndex: getGeneralIndex(asset.xcmV1MultiLocation),
                originLocation: asset.originChainReserveLocation
            });
        }

        result[paraId].push(assetEntry);
    });

    return result;
}

// 辅助函数：从 xcmV1MultiLocation 中获取 generalIndex
function getGeneralIndex(xcmV1MultiLocationStr: string): string | null {
    try {
        const location = JSON.parse(xcmV1MultiLocationStr);
        const interior = location?.v1?.interior;

        if (interior?.x3) {
            const generalIndex = interior.x3.find(x => x.generalIndex !== undefined);
            return generalIndex?.generalIndex?.toString() || null;
        }

        return null;
    } catch {
        return null;
    }
}

const originalJson = require('./dist/chain-registry.json');

const transformedJson = transformChainRegistry(originalJson?.chains);
console.log(JSON.stringify(transformedJson, null, 2));

// 将转换后的 JSON 数据写入新的 JSON 文件
fs.writeJson(
    path.join(__dirname, './dist/transformed-chain-registry.json'),
    transformedJson,
    { spaces: 2 }
).then(() => {
    console.log('Transformed chain registry file created successfully!');
}).catch((err) => {
    console.error('Failed to write transformed chain registry file:', err);
});
