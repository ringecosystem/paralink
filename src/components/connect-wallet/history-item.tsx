import Image from 'next/image';

export const HistoryItem = () => {
  return (
    <div className="flex w-full items-center justify-between text-[12px]">
      <div className="flex items-center gap-[5px] text-[12px] font-semibold leading-[15px]">
        <span className="text-[#0094FF]">Sei</span>
        <Image src="/images/arrow-right.svg" alt="arrow" width={7} height={8} />
        <span className="text-[#242A2E]">Arbitrum</span>
      </div>

      <div className="flex flex-col items-end">
        <p className="font-semibold text-[#242A2E]">
          <span className="font-mono tabular-nums">0.42</span> USDT
        </p>
        <span className="text-[#12161950]">Completed·1 mo gao</span>
      </div>
    </div>
  );
};
