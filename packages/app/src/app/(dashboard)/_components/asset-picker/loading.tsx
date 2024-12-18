'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function AssetPickerLoading() {
  return (
    <div className="flex h-[74px] items-center gap-[10px] rounded-[10px] bg-[#F2F3F5] p-[10px]">
      <Skeleton className="h-[40px] w-[40px] flex-shrink-0 rounded-full" />

      <div className="grid w-full grid-cols-2 items-center gap-[10px]">
        <div
          className={cn(
            'pointer-events-none flex cursor-pointer flex-col items-start opacity-50 transition-opacity hover:opacity-80'
          )}
        >
          <Skeleton className="mb-1 h-5 w-20" />
          <Skeleton className="h-4 w-10" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="mb-1 h-5 w-20" />
          <Skeleton className="h-4 w-10" />
        </div>
      </div>
    </div>
  );
}
