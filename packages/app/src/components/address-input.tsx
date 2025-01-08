'use client';
import Image from 'next/image';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';

interface AddressInputProps {
  value: string;
  error?: React.ReactNode;
  onChange: (address: string) => void;
}

export function AddressInput({ value, onChange, error }: AddressInputProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, []);

  return (
    <div>
      <div className="flex cursor-pointer items-center justify-between gap-[10px] rounded-[10px] bg-[#F2F3F5] pr-[10px] transition-opacity hover:opacity-80">
        <input
          value={value}
          onChange={handleChange}
          placeholder="Enter recipient address"
          className={cn(
            'w-full bg-transparent p-[10px] text-[14px] font-normal text-[#242A2E] placeholder:text-[#12161950] focus-visible:outline-none'
          )}
        />
      </div>
      {error && <div className="mt-1 text-xs">{error}</div>}
    </div>
  );
}
