import { useEffect, useState, useRef } from 'react';
import ss58 from '@substrate/ss58-registry';
import { WsProvider, ApiPromise } from '@polkadot/api';
import { findIconBySymbol, getSupportedParaChains } from '@/lib/registry';
import { useCrossChainSetup } from './use-cross-chain-setup';
import { filterHrmpConnections } from '@/utils/hrmp-validation';
import { findBestWssEndpoint } from '@/utils/rpc-endpoint';
import { SUPPORTED_XCM_PARA_IDS } from '@/config/token';
import useChainsStore from '@/store/chains';
import type { ChainConfig } from '@/types/asset-registry';
import type { ChainInfo } from '@/types/chains-info';
import type { Asset } from '@/types/assets-info';

interface UseChainInitializationProps {
  polkadotAssetRegistry: ChainConfig;
  chainsInfo: ChainInfo[];
  assetsInfo: Asset[];
}
export function useChainInitialization({
  polkadotAssetRegistry,
  chainsInfo,
  assetsInfo
}: UseChainInitializationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const hasInitialized = useRef(false);
  const { setupCrossChainConfig } = useCrossChainSetup();
  const setChains = useChainsStore((state) => state.setChains);

  useEffect(() => {
    const init = async () => {
      if (hasInitialized.current) return;
      if (!polkadotAssetRegistry || !chainsInfo) {
        return;
      }

      hasInitialized.current = true;
      setIsLoading(true);

      const filteredPolkadotAssetRegistry = await filterHrmpConnections({
        polkadotAssetRegistry,
        chainsInfo
      });

      const supportedParaChains = getSupportedParaChains(
        filteredPolkadotAssetRegistry
      );

      const supportedChains = supportedParaChains
        ?.map((chain) => {
          const chainAsset = chainsInfo?.find(
            (v) => v.substrateInfo?.paraId?.toString() === chain.id
          );
          const ss58Format = ss58.find(
            (v) => v.prefix === chainAsset?.substrateInfo?.addressPrefix
          );

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
            xcAssetsData: chain?.xcAssetsData,
            nativeToken: {
              symbol: ss58Format?.symbols?.[0],
              decimals: ss58Format?.decimals?.[0],
              icon: findIconBySymbol(ss58Format?.symbols?.[0], assetsInfo)
            },
            isEvmChain:
              ss58Format?.standardAccount === 'secp256k1' &&
              !!chainAsset?.evmInfo
          };
        })
        ?.filter((v): v is NonNullable<typeof v> => !!v);

      function isValidWsEndpoint(endpoint: string): boolean {
        return endpoint.startsWith('ws://') || endpoint.startsWith('wss://');
      }

      const validateChain = async (chain: (typeof supportedChains)[0]) => {
        if (SUPPORTED_XCM_PARA_IDS.includes(chain.id)) {
          return chain;
        }
        return null;

        const providers = Object.values(chain.providers);
        const validProviders = providers.filter(isValidWsEndpoint);

        if (!validProviders.length) {
          console.warn(
            `No valid WebSocket endpoints found for chain ${chain.id}`
          );
          return null;
        }
        try {
          const WsProviderUrl = await findBestWssEndpoint(chain.providers);

          if (!WsProviderUrl) {
            console.log('no WsProviderUrl');
            return null;
          }
          const provider = new WsProvider(WsProviderUrl);
          const api = await ApiPromise.create({ provider });
          const hasXcmPayment = typeof api?.call?.xcmPaymentApi !== 'undefined';
          await api.disconnect();

          return hasXcmPayment ? chain : null;
        } catch (error) {
          console.error(`Error validating chain ${chain.id}:`, error);
          return null;
        }
      };

      const validatedChains = (
        await Promise.all(supportedChains?.map(validateChain))
      )?.filter((v): v is NonNullable<typeof v> => !!v);

      setChains(validatedChains);
      await setupCrossChainConfig(validatedChains);
      setIsLoading(false);
    };
    init();
  }, [
    setChains,
    setupCrossChainConfig,
    polkadotAssetRegistry,
    chainsInfo,
    assetsInfo
  ]);

  return { isLoading };
}

export type ChainInitializationReturn = ReturnType<
  typeof useChainInitialization
>;
