import { useEffect } from 'react';
import ss58 from '@substrate/ss58-registry';
import { WsProvider, ApiPromise } from '@polkadot/api';

import { getSupportedParaChains } from '@/lib/registry';
import { useCrossChainSetup } from './use-cross-chain-setup';
import type { ChainConfig } from '@/types/asset-registry';
import type { ChainInfo } from '@/types/chains-info';
import { filterHrmpConnections } from '@/utils/hrmp-validation';
import { findBestWssEndpoint } from '@/utils/rpc-endpoint';

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
    const init = async () => {
      if (!polkadotAssetRegistry || !chainsInfo?.length) {
        return;
      }
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
      console.log('supportedChains', supportedChains);
      function isValidWsEndpoint(endpoint: string): boolean {
        return endpoint.startsWith('ws://') || endpoint.startsWith('wss://');
      }

      const validateChain = async (chain: (typeof supportedChains)[0]) => {
        const providers = Object.values(chain.providers);
        const validProviders = providers.filter(isValidWsEndpoint);

        if (!validProviders.length) {
          console.warn(
            `No valid WebSocket endpoints found for chain ${chain.id}`
          );
          return null;
        }
        try {
          const provider = new WsProvider(findBestWssEndpoint(chain.providers));
          console.log('provider', provider);
          const api = await ApiPromise.create({ provider });
          console.log('api', api);
          api.on('connected', () => {
            console.log(`Connected to chain ${chain.id}`);
          });
          api.on('disconnected', () => {
            console.log(`Disconnected from chain ${chain.id}`);
          });
          api.on('error', (error) => {
            console.error(`Error on chain ${chain.id}:`, error);
          });

          const hasXcmPayment = typeof api?.call?.xcmPaymentApi !== 'undefined';
          console.log('hasXcmPayment', hasXcmPayment);
          if (!hasXcmPayment) {
            console.warn(`Chain ${chain.id} does not support xcmPaymentApi`);
            await api.disconnect();
            return null;
          }

          await api.disconnect();
          return chain;
        } catch (error) {
          console.error(`Error validating chain ${chain.id}:`, error);
          return null;
        }
      };

      // const validatedChains = await Promise.allSettled(
      //   supportedChains.map(validateChain)
      // ).then((chains) =>
      //   chains.filter((chain): chain is NonNullable<typeof chain> => !!chain)
      // );
      const validatedChains = (
        await Promise.all(supportedChains?.map(validateChain))
      )?.filter((chain): chain is NonNullable<typeof chain> => !!chain);

      console.log('validatedChains', validatedChains);
      setChains(validatedChains);
      setupCrossChainConfig(validatedChains);
    };
    init();
  }, [setChains, setupCrossChainConfig, polkadotAssetRegistry, chainsInfo]);
}

export type ChainInitializationReturn = ReturnType<
  typeof useChainInitialization
>;
