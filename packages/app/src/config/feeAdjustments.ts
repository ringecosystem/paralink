import { BN } from '@polkadot/util';

export type FeeType =
  | 'minBalance'
  | 'paymentInfo'
  | 'networkFee'
  | 'crossChainFee';

export const FEE_ADJUSTMENTS: Record<FeeType, number> = {
  minBalance: 1.2,
  paymentInfo: 1.2,
  networkFee: 1.2,
  crossChainFee: 1.2
} as const;

export function adjustFee(originalFee: BN, feeType: FeeType): BN {
  try {
    const adjustment = FEE_ADJUSTMENTS[feeType];
    const scaledAdjustment = new BN(Math.round(adjustment * 1_000_000));

    return originalFee.mul(scaledAdjustment).div(new BN(1_000_000));
  } catch (error) {
    console.error(`Fee adjustment failed for ${feeType}:`, error);
    return originalFee;
  }
}
