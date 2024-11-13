'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { FallbackImage } from './ui/fallback-image';
import { ScrollArea } from './ui/scroll-area';
import { Empty } from './empty';
import type { ChainInfoWithXcAssetsData } from '@/store/chains';

interface ChainSelectProps {
  label: string;
  chain?: ChainInfoWithXcAssetsData;
  chains?: ChainInfoWithXcAssetsData[];
  value?: string;
  onChange: (value: string) => void;
}

export const ChainSelect = ({
  label,
  chain,
  chains,
  value,
  onChange
}: ChainSelectProps) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(true);
  };
  const handleChange = (id: string) => {
    if (id === value) return;
    onChange(id);
    setOpen(false);
  };

  return (
    <>
      <div
        className="flex h-[59px] cursor-pointer items-center gap-[10px] rounded-[var(--radius)] bg-[#F2F3F5] p-[10px] transition-opacity hover:opacity-80"
        onClick={handleClick}
      >
        <FallbackImage
          src={chain?.icon || '/images/default-chain.svg'}
          fallbackSrc="/images/default-chain.svg"
          alt="assets"
          width={24}
          height={24}
          className="rounded-full"
        />
        <div className="flex flex-1 flex-col items-start">
          <span className="text-[12px] font-normal text-[#12161950]">
            {label}
          </span>
          <span
            className="line-clamp-1 text-[14px] font-bold text-[#121619]"
            title={chain?.name}
          >
            {chain?.name}
          </span>
        </div>

        <ChevronDown className="h-4 w-4" strokeWidth={2} />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-20px)] gap-0 rounded-[var(--radius)] bg-white p-0 md:w-[320px]">
          <DialogHeader>
            <DialogTitle className="p-[20px] text-[14px] font-bold text-[#242A2E]">
              Select Chain
            </DialogTitle>
          </DialogHeader>
          <div className="w-full px-[20px]">
            <div className="h-[1px] w-full bg-[#12161910]"></div>
          </div>
          <div>
            <ScrollArea className="h-[300px]">
              <div className="pt-[20px]">
                {chains?.length ? (
                  chains?.map((chain, index) => (
                    <div
                      title={chain.name}
                      className={cn(
                        'flex cursor-pointer items-center gap-[10px] px-[20px] py-[10px] transition-all hover:bg-[#12161910] hover:opacity-80',
                        index === chains.length - 1 &&
                          'rounded-b-[var(--radius)]',
                        chain?.id === value && 'cursor-default bg-[#12161910]'
                      )}
                      key={chain?.id}
                      onClick={() => handleChange(chain?.id)}
                    >
                      <FallbackImage
                        src={chain.icon || '/images/default-chain.svg'}
                        fallbackSrc="/images/default-chain.svg"
                        alt={chain.name}
                        width={34}
                        height={34}
                        className="rounded-full"
                      />
                      <span className="text-[16px] font-bold text-[#121619]">
                        {chain.name}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center pt-[20px]">
                    <Empty label="No chains found" />
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
