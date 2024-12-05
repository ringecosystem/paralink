'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useTransactionDetailStore } from '@/store/transaction-detail';
import { toShortAddress } from '@/lib/utils';
import { useShallow } from 'zustand/react/shallow';
import { FallbackImage } from './ui/fallback-image';

function ChainTransactionArrow() {
  return (
    <>
      <div className="loader mx-auto mt-4 hidden md:grid"></div>
      <div className="loader-mobile mx-auto mt-4 grid md:hidden"></div>
    </>
  );
}

export function TransactionDetail() {
  const { isOpen, transaction, close } = useTransactionDetailStore(
    useShallow((state) => ({
      isOpen: state.isOpen,
      transaction: state.transaction,
      close: state.close
    }))
  );

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="w-[calc(100vw-20px)] gap-0 rounded-[10px] p-0 md:w-[600px]">
        <DialogHeader>
          <DialogTitle className="p-[20px] text-[14px] font-bold leading-normal text-[#121619]">
            Transaction Detail
          </DialogTitle>
        </DialogHeader>
        <div className="px-[20px] pb-[20px]">
          <div className="mb-[20px] flex h-[1px] w-full items-center gap-[10px] rounded-[10px] bg-[#F2F3F5]" />

          <div className="flex w-full flex-col gap-[20px] text-[14px]">
            <div className="flex flex-1 flex-col gap-[20px]">
              <div className="flex items-center">
                <span className="w-[80px] font-normal leading-[24px] text-[#242A2E] sm:w-[100px]">
                  Timestamp
                </span>
                <span className="flex-1 text-[14px] font-bold leading-normal text-[#242A2E]">
                  {transaction.timestamp}
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-[80px] font-mono font-normal tabular-nums leading-[24px] text-[#242A2E] sm:w-[100px]">
                  Amount
                </span>
                <span className="flex-1 font-mono text-[14px] font-bold tabular-nums leading-normal text-[#242A2E]">
                  {transaction.amount}
                </span>
              </div>
            </div>

            <div className="grid w-full grid-cols-3 place-items-center rounded-[10px] bg-[#F2F3F5] p-[20px]">
              <ChainInfo
                logo={transaction.fromChain.icon || '/images/default-chain.svg'}
                name={transaction.fromChain.name}
                address={transaction.fromAddress}
                txHash={transaction.fromTxHash}
                explorerUrl={
                  transaction.fromChain?.substrateInfo?.blockExplorer as
                    | string
                    | undefined
                }
              />

              <ChainTransactionArrow />

              <ChainInfo
                logo={transaction.toChain.icon || '/images/default-chain.svg'}
                name={transaction.toChain.name}
                address={transaction.toAddress}
                txHash={transaction.toTxHash}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ChainInfoProps {
  logo: string;
  name: string;
  address: string;
  txHash?: string;
  explorerUrl?: string;
}

function ChainInfo({
  logo,
  name,
  address,
  txHash,
  explorerUrl
}: ChainInfoProps) {
  return (
    <div className="flex w-[100px] flex-col items-center justify-center gap-[10px]">
      <div className="relative size-[50px] md:size-[80px]">
        <FallbackImage
          src={logo}
          fallbackSrc="/images/default-chain.svg"
          alt={`${name} logo`}
          fill
          className="object-contain"
        />
      </div>

      <h4 className="text-center font-mono text-[14px] font-bold tabular-nums leading-normal text-[#242A2E]">
        {toShortAddress(address)}
      </h4>
      {txHash && (
        <a
          href={`${explorerUrl}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="self-stretch text-center font-mono text-[12px] font-normal tabular-nums leading-normal text-[#0085FF]"
        >
          {toShortAddress(txHash)}
        </a>
      )}
    </div>
  );
}
