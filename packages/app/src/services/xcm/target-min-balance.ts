import { BN, bnToBn } from '@polkadot/util';
import { formatTokenBalance, parseUnits } from '@/utils/format';
import type { ApiPromise } from '@polkadot/api';

function normalizeMinBalance(balance: BN, decimals: number): BN {
  const oneToken = new BN(10).pow(new BN(decimals));

  if (balance.gt(oneToken)) {
    return oneToken;
  }

  return balance;
}

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
      const details = assetDetails.toJSON() as { minBalance?: number | string };
      if (details?.minBalance || details?.minBalance === 0) {
        let balanceBN =
          typeof details.minBalance === 'string' &&
            details.minBalance.startsWith('0x')
            ? new BN(details.minBalance.slice(2), 'hex')
            : bnToBn(details.minBalance);
        balanceBN = normalizeMinBalance(balanceBN, decimals);
        return {
          balance: balanceBN,
          formatted: formatTokenBalance(balanceBN, { decimals })
        };
      }
    }
    // TODO
    // if (api.query.assetRegistry?.assetMetadatas) {
    //   const assetMetadata =
    //     await api.query.assetRegistry.assetMetadatas(assetId);
    //   const metadata = assetMetadata.toJSON() as {
    //     minimalBalance?: string | number;
    //   };
    //   if (metadata?.minimalBalance) {
    //     const balanceBN = bnToBn(metadata.minimalBalance);
    //     return {
    //       balance: balanceBN,
    //       formatted: formatTokenBalance(balanceBN, { decimals })
    //     };
    //   }
    // }
    if (api.query.assetRegistry?.assets) {
      const assetDetails = await api.query.assetRegistry.assets(assetId);

      const details = assetDetails?.toJSON() as {
        existentialDeposit?: string;
      } | null;
      if (details?.existentialDeposit) {
        const balanceBN = bnToBn(details.existentialDeposit);
        return {
          balance: balanceBN,
          formatted: formatTokenBalance(balanceBN, { decimals })
        };
      }
    }
    console.log('no details found for min balance');

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
