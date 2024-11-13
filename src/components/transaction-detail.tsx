import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

// ... existing code ...
function ChainTransactionArrow() {
  return (
    <>
      <div className="loader mx-auto mt-4 hidden md:grid"></div>
      <div className="loader-mobile mx-auto mt-4 grid md:hidden"></div>
    </>
  );
}

// ... existing code ...
interface TransactionDetailProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetail({ isOpen, onClose }: TransactionDetailProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                  Mar-10-2024 04:22:08 PM +UTC
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-[80px] font-mono font-normal tabular-nums leading-[24px] text-[#242A2E] sm:w-[100px]">
                  Amount
                </span>
                <span className="flex-1 font-mono text-[14px] font-bold tabular-nums leading-normal text-[#242A2E]">
                  5,000 USDT
                </span>
              </div>
            </div>
            <div className="grid w-full grid-cols-3 place-items-center rounded-[10px] bg-[#F2F3F5] p-[20px]">
              <div className="flex w-[100px] flex-col items-center justify-center gap-[10px]">
                <div className="relative size-[50px] md:size-[80px]">
                  <Image
                    src="/images/test1.svg"
                    alt="logo"
                    fill
                    className="object-contain"
                  />
                </div>

                <h4 className="text-center font-mono text-[14px] font-bold tabular-nums leading-normal text-[#242A2E]">
                  0x092..bb41
                </h4>
                <a
                  href="Tx: 0x092..bb41"
                  className="self-stretch text-center font-mono text-[12px] font-normal tabular-nums leading-normal text-[#0085FF]"
                >
                  0x092..bb41
                </a>
              </div>

              <ChainTransactionArrow />

              <div className="flex w-[100px] flex-col items-center justify-center gap-[10px]">
                <div className="relative size-[50px] md:size-[80px]">
                  <Image
                    src="/images/test1.svg"
                    alt="logo"
                    fill
                    className="object-contain"
                  />
                </div>

                <h4 className="text-center font-mono text-[14px] font-bold tabular-nums leading-normal text-[#242A2E]">
                  0x092..bb41
                </h4>
                <a
                  href="Tx: 0x092..bb41"
                  className="self-stretch text-center font-mono text-[12px] font-normal tabular-nums leading-normal text-[#0085FF]"
                >
                  0x092..bb41
                </a>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
