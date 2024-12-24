'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { stringShorten } from '@polkadot/util';
import { useTransactionHistory } from '@/store/transaction-history';
import useChainsStore from '@/store/chains';

interface TransactionDetailProps {
  txHash: string;
  status: 'finished' | 'pending';
}

export function TransactionDetail({ txHash, status }: TransactionDetailProps) {
  const chains = useChainsStore((state) => state.chains);
  const records = useTransactionHistory((state) => state.records);

  const transaction = useMemo(() => {
    if (!records.length || !txHash) return undefined;
    return records.find((tx) => tx.txHash === txHash);
  }, [records, txHash]);

  const sourceChain = chains.find(
    (chain) => chain.id?.toString() === transaction?.sourceChainId?.toString()
  );
  const targetChain = chains.find(
    (chain) => chain.id?.toString() === transaction?.targetChainId?.toString()
  );

  const blockExplorerUrl = useMemo(() => {
    const explorer = sourceChain?.explorer;
    return explorer ? `${explorer}/tx/${txHash}?tab=xcm_transfer` : '';
  }, [sourceChain, txHash]);

  const getStatusText = () => {
    return status === 'finished' ? 'Sent' : 'Sending';
  };

  const getEndingSymbol = () => {
    return status === 'finished' ? '.' : '...';
  };

  return (
    <div className="flex flex-col gap-[5px] rounded-[10px] bg-white">
      <div className="text-[14px] font-normal leading-[24px] text-[#121619]">
        {getStatusText()}{' '}
        <span className="font-bold text-[#FF0083]">{transaction?.amount}</span>{' '}
        {transaction?.symbol} from
        <span className="font-bold text-[#FF0083]">
          {' '}
          {sourceChain?.name}
        </span>{' '}
        to <span className="font-bold text-[#FF0083]">{targetChain?.name}</span>
        {getEndingSymbol()}
      </div>
      <div>
        <Link
          href={blockExplorerUrl}
          className="flex items-center gap-[10px] font-mono text-[12px] font-normal tabular-nums leading-normal text-[#12161950]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Tx:{stringShorten(txHash)}
          <Image src="/images/link.svg" alt="link" width={8} height={8} />
        </Link>
      </div>
    </div>
  );
}
