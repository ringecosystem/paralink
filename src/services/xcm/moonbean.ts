import { Sdk } from "@moonbeam-network/xcm-sdk";

interface Asset {
    symbol: string;
    originSymbol: string;
    decimals: number;
    minAmount?: string;
}

// 获取两条链之间可用的交易对
export const getAvailableAssets = (sourceParaId: number, targetParaId: number): Asset[] => {
    try {
        const sdkInstance = Sdk();
        const assets = sdkInstance.assets('polkadot');
        const availableAssets: Asset[] = [];

        assets.assets.forEach((asset) => {
            const { sourceChains, source } = assets.asset(asset);

            // 遍历源链
            sourceChains.forEach((sourceChain) => {
                // 检查是否匹配源链 ParaId
                if (sourceChain.parachainId === sourceParaId) {
                    const { destinationChains } = source(sourceChain);

                    // 遍历目标链,检查是否匹配目标链 ParaId
                    destinationChains.forEach((destination) => {
                        if (destination.parachainId === targetParaId) {
                            // 找到匹配的交易对,添加到结果中
                            availableAssets.push(asset);
                        }
                    });
                }
            });
        });

        return availableAssets;

    } catch (error) {
        console.error('获取交易对失败:', error);
        return [];
    }
}

