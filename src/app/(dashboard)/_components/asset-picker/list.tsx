'use client';
import { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { BN } from '@polkadot/util';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty } from '@/components/empty';
import type { AvailableToken } from '@/utils/xcm-token';
import { AssetPickerItem } from './item';

export type BalanceWithSymbol = {
  balance: BN;
  symbol?: string;
};
interface AssetPickerListProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  onSelect: (token: AvailableToken) => void;
  tokens: AvailableToken[];
  tokenBalances?: BalanceWithSymbol[];
}

export function AssetPickerList({
  isOpen,
  onClose,
  isLoading,
  onSelect,
  tokens,
  tokenBalances
}: AssetPickerListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = useMemo(() => {
    if (!searchQuery) return tokens;

    const query = searchQuery.toLowerCase();
    return tokens.filter(
      (token) =>
        token?.symbol?.toLowerCase().includes(query) ||
        token?.name?.toLowerCase().includes(query) ||
        token?.contractAddress?.toLowerCase().includes(query)
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
                      <AssetPickerItem
                        key={token?.symbol}
                        token={token}
                        isLoading={isLoading}
                        onSelect={onSelect}
                        balance={
                          tokenBalances?.find(
                            (balance) => balance.symbol === token.symbol
                          )?.balance
                        }
                      />
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
