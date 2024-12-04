type Capitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : S;

type ToParamCase<T> = {
  [K in keyof T as Capitalize<string & K>]: T[K] extends object
    ? ToParamCase<T[K]>
    : T[K];
};

export interface GeneralKeyV3 {
  length: number;
  data: string;
}

export interface NormalizedInterior {
  here?: null;
  parachain?: number;
  palletInstance?: number;
  generalIndex?: number | string;
  generalKey?: GeneralKeyV3 | string;
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
export type XcmRequestInteriorParams = ToParamCase<NormalizedInterior>;
