export interface ChainInfo {
  slug: string;
  name: string;
  isTestnet: boolean;
  chainStatus: 'ACTIVE' | 'INACTIVE';
  ordinal: number;
  icon: string;
  providers: Record<string, string>;
  evmInfo: EvmInfo | null;
  substrateInfo: SubstrateInfo | null;
  extraInfo: ExtraInfo | null;
  bitcoinInfo: BitcoinInfo | null;
  tonInfo: TonInfo | null;
}

export interface EvmInfo {
  evmChainId: number;
  blockExplorer: string;
  existentialDeposit: string;
  symbol: string;
  decimals: number;
  supportSmartContract: Array<'ERC20' | 'ERC721'>;
  abiExplorer: string | null;
}

export interface CrowdloanFund {
  relayChain: 'polkadot' | 'kusama';
  fundId: string;
  paraId: number;
  status: 'won' | 'failed';
  startTime: string;
  endTime: string;
  auctionIndex: number;
  firstPeriod: number;
  lastPeriod: number;
}

export interface SubstrateInfo {
  relaySlug: string | null;
  paraId: number | null;
  genesisHash: string;
  addressPrefix: number;
  chainType: 'RELAYCHAIN' | 'PARACHAIN';
  crowdloanUrl: string | null;
  blockExplorer: string | null;
  existentialDeposit: string;
  symbol: string;
  decimals: number;
  hasNativeNft: boolean | null;
  supportStaking: boolean | null;
  supportSmartContract: null;
  crowdloanParaId: number | null;
  crowdloanFunds: CrowdloanFund[];
}

export interface ExtraInfo {
  subscanSlug: string | null;
  chainBalanceSlug: string | null;
}

export interface BitcoinInfo {
  blockExplorer: string;
  existentialDeposit: string;
  decimals: number;
  symbol: string;
  bitcoinNetwork: 'mainnet' | 'testnet';
}

export interface TonInfo {
  blockExplorer: string;
  existentialDeposit: string;
  decimals: number;
  symbol: string;
  supportSmartContract: Array<'TEP74' | 'TEP62'>;
}
