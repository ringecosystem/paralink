import { Sdk } from "@moonbeam-network/xcm-sdk";
import { createWalletClient, custom } from 'viem';
import { moonbeam } from 'viem/chains';

declare enum Ecosystem {
    Polkadot = 'polkadot',
    Kusama = 'kusama',
    AlphanetRelay = 'alphanet-relay',
}

export const getEvmSigner = (account: `0x${string}`) => {
    if (typeof window === 'undefined') return null;

    const rpcUrls = [
        'https://rpc.api.moonbeam.network',
        'https://moonbeam.public.blastapi.io',
        'https://moonbeam.api.onfinality.io/public'
    ];

    const moonbeamChain = {
        ...moonbeam,
        rpcUrls: {
            default: {
                http: rpcUrls
            },
            public: {
                http: rpcUrls
            }
        }
    };

    return createWalletClient({
        account,
        chain: moonbeamChain,
        transport: custom(window.ethereum),
        cacheTime: 0,

    });
};
interface Asset {
    symbol: string;
    originSymbol: string;
}

export const getAvailableAssets = (sourceParaId: number, targetParaId: number): Asset[] => {
    try {
        const sdkInstance = Sdk();
        const assets = sdkInstance.assets('polkadot' as Ecosystem);
        const availableAssets: Asset[] = [];

        assets.assets.forEach((asset) => {
            const { sourceChains, source } = assets.asset(asset);
            sourceChains.forEach((sourceChain) => {
                if (sourceChain.parachainId === sourceParaId) {
                    const { destinationChains } = source(sourceChain);
                    destinationChains.forEach((destination) => {
                        if (destination.parachainId === targetParaId) {
                            availableAssets.push({
                                symbol: asset.originSymbol,
                                originSymbol: asset.originSymbol,
                            });
                        }
                    });
                }
            });
        });
        return availableAssets;
    } catch (error) {
        console.error('get available assets error:', error);
        return [];
    }
}

const getChainNameByParaId = (paraId: number): string | null => {
    try {
        const sdkInstance = Sdk();
        const assets = sdkInstance.assets('polkadot' as Ecosystem);

        for (const asset of assets.assets) {
            const { sourceChains } = assets.asset(asset);

            for (const chain of sourceChains) {
                if (chain.parachainId === paraId) {
                    return chain.key;
                }
            }
            const { source } = assets.asset(asset);
            const firstSourceChain = sourceChains[0];
            if (firstSourceChain) {
                const { destinationChains } = source(firstSourceChain);
                for (const chain of destinationChains) {
                    if (chain.parachainId === paraId) {
                        return chain.key;
                    }
                }
            }
        }

        return null;
    } catch (error) {
        console.error('Get chain name error:', error);
        return null;
    }
}

export const transferFromMoonbeam = async ({
    amount,
    destinationChainId,
    sourceAddress,
    destinationAddress,
    token,
}: {
    amount: string;
    destinationChainId: number;
    sourceAddress: string;
    destinationAddress: string;
    token: string;
}) => {

    const chainName = getChainNameByParaId(destinationChainId);
    try {
        const evmSigner = getEvmSigner(sourceAddress as `0x${string}`);
        console.log('evmSigner', evmSigner);
        if (!evmSigner) {
            throw new Error('EVMSigner not available');
        }
        const sdkInstance = Sdk();
        if (!chainName) {
            throw new Error(`Cannot find chain name for parachain ID: ${destinationChainId}`);
        }
        const transferData = await sdkInstance
            .assets()
            .asset(token.toLowerCase())
            .source('moonbeam')
            .destination(chainName)
            .accounts(
                sourceAddress,
                destinationAddress,
                {
                    evmSigner,
                }
            );
        const txHash = await transferData.transfer(amount);
        return {
            success: true,
            txHash,
            message: `Successfully transferred ${amount} ${token} to ${chainName}`
        };

    } catch (error) {
        console.error('Transfer error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            message: `Failed to transfer ${amount} ${token} to ${chainName}`
        };
    }
}
