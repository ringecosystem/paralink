import { useMemo, useState } from 'react';
import { BN, BN_ZERO, bnToBn } from '@polkadot/util';
import { isNil } from 'lodash-es';
import { useShallow } from 'zustand/react/shallow';
import { useDebounceEffect } from '@/hooks/use-debounce-effect';
import { getMinBalance } from '@/services/xcm/get-min-balance';
import useApiConnectionsStore from '@/store/api-connections';
import useChainsStore from '@/store/chains';
import type { Asset } from '@/types/xcm-asset';

interface UseMinBalanceProps {
  chainId?: number;
  asset?: Asset;
  decimals?: number | null;
}

interface AssetInfo {
  assetId: string | number;
  minAmount?: BN;
}

export const useMinBalance = ({ asset, decimals }: UseMinBalanceProps) => {
  const [balance, setBalance] = useState<BN>(BN_ZERO);
  const [isLoading, setIsLoading] = useState(false);
  const getValidApi = useApiConnectionsStore((state) => state.getValidApi);

  const { targetChainId, sourceChain, targetChain } = useChainsStore(
    useShallow((state) => ({
      targetChainId: state.targetChainId,
      sourceChain: state.getFromChain(),
      targetChain: state.getToChain()
    }))
  );

  const assetInfo = useMemo((): AssetInfo => {
    if (!sourceChain || !targetChain) return { assetId: '-1' };

    // Native token of target chain
    if (
      asset?.symbol?.toLowerCase() ===
      targetChain?.nativeToken?.symbol?.toLowerCase()
    ) {
      return { assetId: '-2' };
    }

    // Native asset in source chain
    if (asset?.isNative) {
      const registeredAsset = asset?.registeredChains?.[targetChain?.id];
      return {
        assetId: (registeredAsset?.assetId as string | number) ?? '-1',
        minAmount: registeredAsset?.minAmount
          ? bnToBn(registeredAsset?.minAmount)
          : undefined
      };
    }

    // Local assets in target chain
    if (targetChain?.localAssets?.length) {
      const localAsset = targetChain.localAssets.find(
        (value) => value?.symbol?.toLowerCase() === asset?.symbol?.toLowerCase()
      );
      if (localAsset) {
        return {
          assetId: localAsset.assetId as string | number,
          minAmount: localAsset.minAmount
            ? bnToBn(localAsset.minAmount)
            : undefined
        };
      }
    }

    // Cross-chain assets
    const targetXcAssets = targetChain?.xcAssetsData?.[sourceChain?.id];
    const xcAsset = targetXcAssets?.find(
      (value) => value?.symbol?.toLowerCase() === asset?.symbol?.toLowerCase()
    );

    return {
      assetId: (xcAsset?.assetId as string | number) ?? '-1',
      minAmount: xcAsset?.minAmount ? bnToBn(xcAsset?.minAmount) : undefined
    };
  }, [sourceChain, targetChain, asset, decimals]);

  useDebounceEffect(() => {
    const fetchMinBalance = async () => {
      if (isNil(targetChainId) || !assetInfo.assetId || !decimals) return;

      // Use predefined minAmount for special cases
      if (assetInfo.assetId === '-2') {
        setBalance(BN_ZERO);
        return;
      }

      // Use the minAmount from asset info
      if (assetInfo.minAmount && assetInfo.minAmount.gt(BN_ZERO)) {
        setBalance(assetInfo.minAmount);
        return;
      }

      // if minAmount isZero or undefined, Fallback to API call for other cases
      setIsLoading(true);
      const api = await getValidApi(targetChainId);
      const { balance } = await getMinBalance({
        api,
        assetId: assetInfo.assetId,
        decimals
      });

      setBalance(balance);
      setIsLoading(false);
    };

    fetchMinBalance();
    return () => {
      setBalance(BN_ZERO);
      setIsLoading(false);
    };
  }, [getValidApi, targetChainId, assetInfo, decimals]);
  return {
    balance,
    isLoading
  };
};
