'use client';
import Image from 'next/image';
import Link from 'next/link';
import { stringShorten } from '@polkadot/util';
import { useTransactionHistory } from '@/store/transaction-history';
import { useMemo } from 'react';
import useChainsStore from '@/store/chains';

interface TransactionToastFinishedProps {
  txHash: string;
}

export function TransactionToastFinished({
  txHash
}: TransactionToastFinishedProps) {
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
    if (transaction?.uniqueId) {
      return `https://polkadot.subscan.io/xcm_message/polkadot-${transaction.uniqueId}`;
    }
    const explorer = sourceChain?.isEvmChain
      ? sourceChain?.evmInfo?.blockExplorer
      : sourceChain?.substrateInfo?.blockExplorer;
    return explorer ? `${explorer}/tx/${txHash}` : '';
  }, [transaction, sourceChain, txHash]);

  return (
    <div className="flex flex-col gap-[5px] rounded-[10px] bg-white">
      <div className="text-[14px] font-normal leading-[24px] text-[#121619]">
        Sent{' '}
        <span className="font-bold text-[#FF0083]">{transaction?.amount}</span>{' '}
        {transaction?.symbol} from
        <span className="font-bold text-[#FF0083]">
          {' '}
          {sourceChain?.name}
        </span>{' '}
        to <span className="font-bold text-[#FF0083]">{targetChain?.name}</span>
        .
      </div>
      <div>
        <Link
          href={blockExplorerUrl}
          className="flex items-center gap-[10px] font-mono text-[12px] font-normal tabular-nums leading-normal text-[#12161950]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Tx:{stringShorten(transaction?.uniqueId ?? txHash)}
          <Image src="/images/link.svg" alt="link" width={8} height={8} />
        </Link>
      </div>
    </div>
  );
}
