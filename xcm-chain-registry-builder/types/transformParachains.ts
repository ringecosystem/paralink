import { ChainStatus } from "./enum";
import { XcmV1Location } from "./xcm-location";




export interface SubstrateInfo {
    paraId: string;
    addressPrefix: number;
    existentialDeposit: string;
    blockExplorer?: string;
}

export interface Provider {
    name?: string;
    url: string;
}

export interface AssetsInfo {
    [key: string]: string;
}


export interface XcmAssetData {
    paraID: number;
    asset: string;
    symbol: string;
    decimals: number;
    xcmV1MultiLocation: string;
    originChainReserveLocation?: string;
}

export interface NativeToken {
    symbol: string;
    decimals: number;
    icon: string;
}

export interface EvmInfo {
    evmChainId: string;
    blockExplorer: string;
}

export interface ChainInfo {
    id: string;
    name: string;
    substrateInfo: SubstrateInfo;
    providers: string[];
    assetsInfo: AssetsInfo;
    xcAssetsData: XcmAssetData[];
    nativeToken: NativeToken;
    isEvm: boolean;
    evmInfo?: EvmInfo;
    chainStatus: ChainStatus;
    icon?: string;
    extraInfo?: {
        subscanSlug?: string;
    };
}

export interface SupportedChains {
    supportedChains: ChainInfo[];
}
export interface ChainRegistryItem {
    id: string;
    name: string;
    slug?: string;
    icon?: string;
    addressPrefix: number;
    providers: Record<string, string>;
    alive: boolean;
    existentialDeposit: string;
    assetsType: 'assets' | 'tokens' | null;
    isEvm: boolean;
    explorer?: string;
    evmChainId?: number;
    nativeToken: {
        symbol: string;
        decimals: number;
        icon: string;
        registeredChains: {
            [paraId: string]: {
                assetId: string;
                symbol: string;
                decimals: number;
                isNative: boolean;
                reserveType: string;
                icon: string;
                xcmLocation: XcmV1Location;
            };
        } | null;
    };
    localAssets?: {
        [paraId: string]: Array<{
            assetId: string;
            symbol: string;
            decimals: number;
            reserveType: string;
            xcmLocation: XcmV1Location;
            icon: string;
        }>;
    };
    xcmPaymentAcceptTokens?: string[];
    xcAssetsData?: {
        [paraId: string]: Array<{
            assetId: string;
            symbol: string;
            decimals: number;
            xcmLocation: XcmV1Location;
            reserveType: string;
            icon: string;
        }>;
    };
}

export interface TransformedChainRegistry {
    [chainId: string]: ChainRegistryItem;
}


