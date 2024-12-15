import type { ToParamCase } from './tool';

export interface GeneralKeyV3 {
  length: number;
  data: string;
}
export interface XcmJunction {
  here?: null;
  parachain?: number;
  palletInstance?: number;
  generalIndex?: number | string;
  generalKey?: GeneralKeyV3 | string;
  [key: number]: GeneralKeyV3;
  accountKey20?: {
    network: string | null;
    key: string;
  };
  accountId32?: {
    network: string | null;
    id: string;
  };
  globalConsensus?: {
    ethereum?: {
      chainId: string | number;
    };
    polkadot?: boolean;
    kusama?: boolean;
  };
}

export type XcmInterior = {
  here?: null;
  x1?: XcmJunction;
  x2?: [XcmJunction, XcmJunction];
  x3?: [XcmJunction, XcmJunction, XcmJunction];
  x4?: [XcmJunction, XcmJunction, XcmJunction, XcmJunction];
};

export type XcmV1Location = {
  v1: {
    parents: number;
    interior: XcmInterior
  };
};

export type XcmRequestJunctionParams = ToParamCase<XcmJunction>;
export type XcmRequestInteriorParams = ToParamCase<XcmInterior>;
