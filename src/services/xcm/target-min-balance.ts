import { formatTokenBalance, parseUnits } from '@/utils/format';
import { removeCommasAndConvertToBN } from '@/utils/number';

import { ApiPromise } from '@polkadot/api';
import { BN } from '@polkadot/util';

export async function getTargetMinBalance({
  api,
  assetId,
  decimals
}: {
  api: ApiPromise;
  assetId: number | string | null;
  decimals: number;
}): Promise<{
  balance: BN;
  formatted: string;
}> {
  try {
    if (api.query.assets?.asset) {
      const assetDetails = await api.query.assets.asset(assetId);
      const details = assetDetails.toHuman() as { minBalance?: string };
      if (details?.minBalance) {
        const balanceBN = removeCommasAndConvertToBN(details.minBalance);
        return {
          balance: balanceBN,
          formatted: formatTokenBalance(balanceBN, { decimals })
        };
      }
    }

    if (api.query.assetRegistry?.assetMetadatas) {
      const assetMetadata =
        await api.query.assetRegistry.assetMetadatas(assetId);
      const metadata = assetMetadata.toHuman() as { minimalBalance?: string };
      if (metadata?.minimalBalance) {
        const balanceBN = removeCommasAndConvertToBN(metadata.minimalBalance);
        return {
          balance: balanceBN,
          formatted: formatTokenBalance(balanceBN, { decimals })
        };
      }
    }
    if (api.query.assetRegistry?.assets) {
      const assetDetails = await api.query.assetRegistry.assets(assetId);
      const details = assetDetails?.toHuman() as {
        existentialDeposit?: string;
      } | null;
      if (details?.existentialDeposit) {
        const balanceBN = removeCommasAndConvertToBN(
          details.existentialDeposit
        );
        return {
          balance: balanceBN,
          formatted: formatTokenBalance(balanceBN, { decimals })
        };
      }
    }

    return {
      balance: parseUnits({
        value: '1',
        decimals
      }),
      formatted: '1'
    };
  } catch (error) {
    console.error('Failed to get target min balance:', error);
    return {
      balance: parseUnits({
        value: '1',
        decimals
      }),
      formatted: '1'
    };
  }
}
