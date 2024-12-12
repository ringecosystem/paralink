export type XcmV1Location = {
    v1: {
        parents: number;
        interior: XcmInterior;
    };
};

export type XcmInterior = {
    here?: null;
    x1?: XcmJunction;
    x2?: [XcmJunction, XcmJunction | any[]];
    x3?: [XcmJunction, XcmJunction, XcmJunction];
};

export type XcmJunction = {
    parachain?: number;
    palletInstance?: number;
    generalIndex?: string | number;
    generalKey?: string;
    accountKey20?: {
        network: null;
        key: string;
    };
    globalConsensus?: {
        ethereum: {
            chainId: number;
        };
    };
};

export enum ReserveType {
    Local = 'local',
    Foreign = 'foreign',
    Remote = 'remote'
}

export type Asset = {
    isNative?: boolean;
    assetId: string | number | { [key: string]: string | number };
    symbol: string;
    decimals: number;
    xcmLocation: XcmV1Location;
    icon: string;
    reserveType: ReserveType;
};

export type ChainRegistry = {
    [chainId: string]: Chain;
};


export type Chain = {
    slug: string;
    name: string;
    icon: string;
    addressPrefix: number;
    providers: string[];
    alive: boolean;
    existentialDeposit: string;
    assetsType: "assets" | "tokens";
    isEvm: boolean;
    explorer: string;
    evmChainId?: number;
    nativeToken: NativeToken;
    xcAssetsData?: XcAssetsData;
    localAssets?: {
        [chainId: string]: Asset[];
    };
};

export type ChainConfig = Chain & {
    id: number;
};

export type NativeToken = {
    symbol: string;
    decimals: number;
    icon: string;
    registeredChains: {
        [chainId: string]: Asset;
    };
};

export type XcAssetsData = {
    [chainOrOrigin: string]: Asset[];
};

