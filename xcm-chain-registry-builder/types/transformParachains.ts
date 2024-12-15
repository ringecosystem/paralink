export interface XcAssetData {
    paraID: number;
    nativeChainID: string | null;
    symbol: string;
    decimals: number;
    xcmV1MultiLocation: string;
    asset: string | number | { Token2?: string | number; VToken2?: string | number; VSToken2?: string | number; Native?: string };
    assetHubReserveLocation: string;
    originChainReserveLocation?: string;
}

export interface NativeToken {
    symbol: string;
    decimals: number;
    icon: string;
}

export interface EvmInfo {
    evmChainId: number;
    blockExplorer: string;
    existentialDeposit: string;
    symbol: string;
    decimals: number;
    supportSmartContract: string[];
    abiExplorer: string;
}

export interface SubstrateInfo {
    relaySlug: string;
    paraId: number;
    genesisHash: string;
    addressPrefix: number;
    chainType: string;
    crowdloanUrl: string | null;
    blockExplorer: string;
    existentialDeposit: string;
    symbol: string;
    decimals: number;
    hasNativeNft: boolean;
    supportStaking: boolean;
    supportSmartContract: string[] | null;
    crowdloanParaId: number | null;
    crowdloanFunds: Array<{
        relayChain: string;
        fundId: string;
        paraId: number;
        status: string;
        startTime: string;
        endTime: string;
        auctionIndex: number;
        firstPeriod: number;
        lastPeriod: number;
    }>;
}

export interface ExtraInfo {
    subscanSlug: string;
    chainBalanceSlug: string;
}

export interface ChainRegistry {
    slug: string;
    name: string;
    isTestnet: boolean;
    chainStatus: string;
    icon: string;
    providers: {
        [key: string]: string;
    };
    evmInfo: EvmInfo | null;
    substrateInfo: SubstrateInfo;
    extraInfo: ExtraInfo;
    bitcoinInfo: null;
    tonInfo: null;
    id: string;
    assetsInfo: {
        [key: string]: string;
    };
    xcAssetsData: XcAssetData[];
    nativeToken: NativeToken;
    isEvm: boolean;
}

export type Registry = ChainRegistry[];