'use client';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container flex flex-col gap-[30px] pt-[min(120px,15vh)] md:pt-[min(100px,12vh)]">
      <div className="mx-auto flex w-full flex-col gap-[20px] rounded-[var(--radius)] bg-white p-[15px] shadow-sm md:w-[460px] md:rounded-[var(--radius-lg)] md:p-[20px]">
        <Skeleton className="h-[64px] w-full rounded-[10px]" />

        <Skeleton className="h-[74px] w-full rounded-[10px]" />

        <Skeleton className="h-[44px] w-full rounded-[10px]" />
        <Skeleton className="h-[44px] w-full rounded-[10px]" />
        <div className="h-[1px] w-full"></div>
        <Skeleton
          className="h-[34px] w-full rounded-[10px] font-bold"
          color="primary"
        ></Skeleton>
      </div>
    </div>
  );
}
