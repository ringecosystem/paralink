'use client';

import { HistoryItem } from './history-item';
import { ScrollArea } from '../ui/scroll-area';

export const History = () => {
  return (
    <div className="flex w-full flex-col">
      <ScrollArea className="h-[200px]">
        <div className="flex flex-col gap-[10px] pr-[10px]">
          <HistoryItem />
          <HistoryItem />
          <HistoryItem />
          <HistoryItem />
          <HistoryItem />
          <HistoryItem />
          <HistoryItem />
          <HistoryItem />
          <HistoryItem />
          <HistoryItem />
          <HistoryItem />
          <HistoryItem />
          <HistoryItem />
          <HistoryItem />
        </div>
      </ScrollArea>
    </div>
  );
};
