import { useEffect, useState, useRef } from 'react';
import ss58 from '@substrate/ss58-registry';
import { WsProvider, ApiPromise } from '@polkadot/api';

import { getSupportedParaChains } from '@/lib/registry';
import { useCrossChainSetup } from './use-cross-chain-setup';
import type { ChainConfig } from '@/types/asset-registry';
import type { ChainInfo } from '@/types/chains-info';
import { filterHrmpConnections } from '@/utils/hrmp-validation';
import { findBestWssEndpoint } from '@/utils/rpc-endpoint';
import { SUPPORTED_XCM_PARA_IDS } from '@/config/token';
import useChainsStore from '@/store/chains';
import { Asset } from '@/types/assets-info';

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
  const { setupCrossChainConfig } = useCrossChainSetup(assetsInfo);
  const setChains = useChainsStore((state) => state.setChains);

  useEffect(() => {
    const init = async () => {
      if (hasInitialized.current) return;
      if (!polkadotAssetRegistry || !chainsInfo) {
        return;
      }
      // console.log('polkadotAssetRegistry', polkadotAssetRegistry);
      // console.log('chainsInfo', chainsInfo);
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
            foreignAssetsInfo: chain?.foreignAssetsInfo,
            xcAssetsData: chain?.xcAssetsData,
            nativeToken: {
              symbol: ss58Format?.symbols?.[0],
              decimals: ss58Format?.decimals?.[0]
            },
            isEvmChain:
              ss58Format?.standardAccount === 'secp256k1' &&
              !!chainAsset?.evmInfo
          };
        })
        ?.filter((v): v is NonNullable<typeof v> => !!v);
      // console.log(
      //   'supportedChains',
      //   supportedChains?.map((v) => {
      //     return {
      //       id: v?.substrateInfo?.paraId,
      //       name: v.name
      //     };
      //   })
      // );
      function isValidWsEndpoint(endpoint: string): boolean {
        return endpoint.startsWith('ws://') || endpoint.startsWith('wss://');
      }

      const validateChain = async (chain: (typeof supportedChains)[0]) => {
        const result = {
          ...chain,
          hasXcmPayment: false
        };
        if (SUPPORTED_XCM_PARA_IDS.includes(chain.id)) {
          result.hasXcmPayment = true;
          return result;
        } else {
          return result;
        }

        // const providers = Object.values(chain.providers);
        // const validProviders = providers.filter(isValidWsEndpoint);

        // if (!validProviders.length) {
        //   console.warn(
        //     `No valid WebSocket endpoints found for chain ${chain.id}`
        //   );
        //   return result;
        // }
        // try {
        //   const WsProviderUrl = await findBestWssEndpoint(chain.providers);

        //   if (!WsProviderUrl) {
        //     console.log('no WsProviderUrl');
        //     return result;
        //   }
        //   const provider = new WsProvider(WsProviderUrl);
        //   const api = await ApiPromise.create({ provider });
        //   result.hasXcmPayment =
        //     typeof api?.call?.xcmPaymentApi !== 'undefined';

        //   console.log(
        //     `Chain ${chain.id} xcmPayment support: ${result.hasXcmPayment}`
        //   );
        //   await api.disconnect();

        //   return result;
        // } catch (error) {
        //   console.error(`Error validating chain ${chain.id}:`, error);
        //   return result;
        // }
      };

      const validatedChains = await Promise.all(
        supportedChains?.map(validateChain)
      );

      // console.log('validatedChains', validatedChains);
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
