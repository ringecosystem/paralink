'use client';

import { ExternalLink, Search } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FallbackImage } from '@/components/ui/fallback-image';
import { Empty } from './empty';

import type { TokenWithBalance } from '@/types/token';

interface TokenSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: TokenWithBalance) => void;
  tokens: TokenWithBalance[];
}

export function TokenSelectDialog({
  isOpen,
  onClose,
  onSelect,
  tokens
}: TokenSelectDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = useMemo(() => {
    if (!searchQuery) return tokens;

    const query = searchQuery.toLowerCase();
    return tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(query) ||
        token.name?.toLowerCase().includes(query) ||
        token?.address?.toLowerCase().includes(query)
    );
  }, [tokens, searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-20px)] gap-0 rounded-[10px] p-0 md:w-[420px]">
        <DialogHeader className="mb-[10px]">
          <DialogTitle className="p-[20px] pb-[10px] text-[14px] font-bold leading-normal text-[#121619]">
            Select A Token
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-[10px] px-[20px]">
          <div className="flex w-full items-center gap-[10px] rounded-[10px] bg-[#F2F3F5] p-[10px]">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Token Name, Symbol, or Contract Address"
              className="h-[24px] flex-1 bg-transparent text-[12px] font-normal leading-[24px] text-[#12161950] focus-visible:outline-none md:text-[14px]"
            />
            <Search
              className="h-4 w-4 transition-opacity hover:opacity-80"
              color="#C6C6C6"
            />
          </div>

          <div className="h-[1px] bg-[#12161910]"></div>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="px-[10px] py-[40px]">
            {filteredTokens?.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-[20px]">
                <Empty label="No tokens found" />
              </div>
            ) : (
              <div className="flex flex-col gap-[20px]">
                {filteredTokens?.length
                  ? filteredTokens?.map((token) => (
                      <div
                        key={token?.symbol}
                        onClick={() => onSelect(token)}
                        className="flex w-full cursor-pointer items-center justify-between gap-[10px] rounded-[var(--radius)] px-[10px] py-[10px] transition-all hover:bg-[#12161910] hover:opacity-80"
                      >
                        <div className="relative h-[34px] w-[34px]">
                          <FallbackImage
                            src={token?.icon || '/images/default-token.svg'}
                            fallbackSrc="/images/default-token.svg"
                            alt={token?.symbol}
                            fill
                            className="rounded-full"
                          />
                        </div>
                        <div className="flex flex-1 items-center gap-[10px]">
                          <div className="flex flex-1 flex-col">
                            <span className="truncate text-[16px] font-bold leading-normal">
                              {token?.symbol}
                            </span>
                            <div className="item-start flex flex-col gap-[5px] md:flex-row md:items-center">
                              <span className="text-[12px] text-[#121619]">
                                {token?.name}
                              </span>
                              {token?.address ? (
                                <div className="flex items-center gap-[5px]">
                                  <span className="font-mono text-[12px] tabular-nums text-[#878A92]">
                                    {token?.address?.slice(0, 6)}...
                                    {token?.address?.slice(-6)}
                                  </span>
                                  <ExternalLink
                                    className="h-3 w-3"
                                    color="#12161950"
                                  />
                                </div>
                              ) : null}
                            </div>
                          </div>
                          {token?.balance ? (
                            <span className="text-right font-mono text-[16px] font-bold tabular-nums">
                              {token.balance}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))
                  : null}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
