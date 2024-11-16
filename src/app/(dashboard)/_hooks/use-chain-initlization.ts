import { useEffect } from 'react';
import ss58 from '@substrate/ss58-registry';

import { getSupportedParaChains } from '@/lib/registry';
import { useCrossChainSetup } from './use-cross-chain-setup';
import type { ChainConfig } from '@/types/asset-registry';
import type { ChainInfo } from '@/types/chains-info';

interface UseChainInitializationProps {
  polkadotAssetRegistry: ChainConfig;
  chainsInfo: ChainInfo[];
}
export function useChainInitialization({
  polkadotAssetRegistry,
  chainsInfo
}: UseChainInitializationProps) {
  const { setupCrossChainConfig, setChains } = useCrossChainSetup();

  useEffect(() => {
    if (!polkadotAssetRegistry || !chainsInfo?.length) {
      return;
    }

    const supportedParaChains = getSupportedParaChains(polkadotAssetRegistry);

    const supportedChains = supportedParaChains
      ?.map((chain) => {
        const chainAsset = chainsInfo?.find(
          (v) => v.substrateInfo?.paraId?.toString() === chain.id
        );
        const ss58Format = ss58.find(
          (v) => v.prefix === chainAsset?.substrateInfo?.addressPrefix
        );
        // 分别处理不同的情况
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
          foreignAssetsInfo: chain?.foreignAssetsInfo,
          xcAssetsData: chain?.xcAssetsData,
          nativeToken: {
            symbol: ss58Format?.symbols?.[0],
            decimals: ss58Format?.decimals?.[0]
          },
          isEvmChain:
            ss58Format?.standardAccount === 'secp256k1' && !!chainAsset?.evmInfo
        };
      })
      ?.filter((v) => !!v);

    // set assets and chains
    setChains(supportedChains);

    // setup cross chain config
    setupCrossChainConfig(supportedChains);
  }, [setChains, setupCrossChainConfig, polkadotAssetRegistry, chainsInfo]);
}

export type ChainInitializationReturn = ReturnType<
  typeof useChainInitialization
>;
