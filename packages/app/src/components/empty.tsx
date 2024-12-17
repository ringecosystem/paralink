import Image from 'next/image';
import { cn } from '@/lib/utils';
export const Empty = ({
  label,
  className
}: {
  label: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[10px]',
        className
      )}
    >
      <div className="flex flex-col items-center gap-[0.825rem]">
        <Image
          src="/images/empty.svg"
          alt="empty"
          className="h-[56px] w-[116px]"
          width={116}
          height={56}
        />
        <p className="m-0 text-[0.75rem] font-normal text-foreground/50">
          {label}
        </p>
      </div>
    </div>
  );
};
