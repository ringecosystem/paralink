import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import useChainsStore from '@/store/chains';
import { stringShorten } from '@polkadot/util';
import { formatTimeAgo } from '@/utils/date';

interface HistoryItemProps {
  sourceChainId: number;
  targetChainId: number;
  amount: string;
  symbol: string;
  txHash: string;
  uniqueId?: string;
  createTime: number;
}
export const HistoryItem = ({
  sourceChainId,
  targetChainId,
  amount,
  txHash,
  uniqueId,
  createTime,
  symbol
}: HistoryItemProps) => {
  const chains = useChainsStore((state) => state.chains);
  const sourceChain = chains.find(
    (chain) => chain.id?.toString() === sourceChainId?.toString()
  );
  const targetChain = chains.find(
    (chain) => chain.id?.toString() === targetChainId?.toString()
  );
  const blockExplorerUrl = useMemo(() => {
    if (uniqueId) {
      return `https://polkadot.subscan.io/xcm_message/polkadot-${uniqueId}`;
    }
    const explorer = sourceChain?.isEvmChain
      ? sourceChain?.evmInfo?.blockExplorer
      : sourceChain?.substrateInfo?.blockExplorer;
    return explorer ? `${explorer}/tx/${txHash}` : '';
  }, [sourceChain, txHash, uniqueId]);

  return (
    <div className="flex w-full flex-col items-center justify-between gap-[5px] rounded-[10px] bg-[#F2F3F5] p-[10px]">
      <div className="flex w-full items-center justify-between gap-[5px]">
        <div className="flex items-center gap-[2px]">
          <span
            className="text-[12px] font-normal leading-normal text-[#121619]"
            title={sourceChain?.name}
          >
            {sourceChain?.slug}
          </span>
          <Image
            src="/images/arrow-right.svg"
            alt="arrow"
            width={7}
            height={8}
          />
          <span
            className="text-[12px] font-normal leading-normal text-[#121619]"
            title={targetChain?.name}
          >
            {targetChain?.slug}
          </span>
        </div>
        <div className="font-mono text-[12px] font-normal tabular-nums leading-normal text-[#121619]">
          {amount} {symbol}
        </div>
      </div>

      <div className="flex w-full items-center justify-between">
        <Link
          href={blockExplorerUrl}
          className="flex items-center gap-[5px] font-mono text-[11px] font-normal tabular-nums leading-[15px] text-[#12161950]"
          target={blockExplorerUrl}
          rel="noopener noreferrer"
        >
          Tx:{stringShorten(uniqueId ?? txHash)}
          <Image src="/images/link.svg" alt="link" width={8} height={8} />
        </Link>
        <div className="text-[11px] font-normal leading-[15px] text-[#12161950]">
          {formatTimeAgo((createTime / 1000).toString())}
        </div>
      </div>
    </div>
  );
};
