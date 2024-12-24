import { useEffect, useMemo, useState } from 'react';
import { BN, BN_ZERO } from '@polkadot/util';
import { isNil } from 'lodash-es';
import { useShallow } from 'zustand/react/shallow';
import { getMinBalance } from '@/services/xcm/get-min-balance';
import useApiConnectionsStore from '@/store/api-connections';
import useChainsStore from '@/store/chains';
import { parseUnits } from '@/utils/format';
import type { Asset } from '@/types/xcm-asset';

interface UseMinBalanceProps {
  chainId?: number;
  asset?: Asset;
  decimals?: number | null;
}
export const useMinBalance = ({ asset, decimals }: UseMinBalanceProps) => {
  const [formatted, setFormatted] = useState<string>('0');
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

  const assetId = useMemo(() => {
    if (!sourceChain || !targetChain) return null;
    if (
      asset?.symbol?.toLowerCase() ===
      targetChain?.nativeToken?.symbol?.toLowerCase()
    ) {
      return '-2';
    }
    if (asset?.isNative) {
      return asset?.registeredChains?.[targetChain?.id]?.assetId ?? '-1';
    }
    if (targetChain?.localAssets && !!targetChain?.localAssets.length) {
      const result = targetChain?.localAssets.find(
        (value) => value?.symbol?.toLowerCase() === asset?.symbol?.toLowerCase()
      );
      if (result) {
        return result?.assetId;
      }
    }
    const targetXcAssets = targetChain?.xcAssetsData?.[sourceChain?.id];
    const result = targetXcAssets?.find(
      (value) => value?.symbol?.toLowerCase() === asset?.symbol?.toLowerCase()
    );
    return result?.assetId ?? '-1';
  }, [sourceChain, targetChain, asset]);

  useEffect(() => {
    console.log('useMinBalance');
    const fetchMinBalance = async () => {
      if (isNil(targetChainId) || !assetId || !decimals) return;
      if (assetId === '-2') {
        setFormatted('0');
        setBalance(BN_ZERO);
        return;
      }
      if (assetId === '-1') {
        setFormatted('1');
        setBalance(
          parseUnits({
            value: '1',
            decimals
          })
        );
        return;
      }
      setIsLoading(true);
      console.log('fetching min balance');
      const api = await getValidApi(targetChainId);
      const { balance, formatted } = await getMinBalance({
        api,
        assetId,
        decimals
      });

      setFormatted(formatted);
      setBalance(balance);
      setIsLoading(false);
    };
    fetchMinBalance();
    return () => {
      setFormatted('0');
      setBalance(BN_ZERO);
      setIsLoading(false);
    };
  }, [getValidApi, targetChainId, assetId, decimals]);
  return {
    formatted,
    balance,
    isLoading
  };
};
