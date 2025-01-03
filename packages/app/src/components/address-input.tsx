'use client';
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { RecipientModal } from './recipient-modal';

import type { ChainConfig } from '@/types/xcm-asset';

interface AddressInputProps {
  value: string;
  error?: React.ReactNode;
  chain?: ChainConfig;
  onChange: (address: string) => void;
}

export function AddressInput({
  value,
  chain,
  onChange,
  error
}: AddressInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  function handleEdit() {
    setIsOpen(true);
  }
  return (
    <div>
      <div
        className="flex cursor-pointer items-center justify-between gap-[10px] rounded-[10px] bg-[#F2F3F5] p-[10px] transition-opacity hover:opacity-80"
        onClick={handleEdit}
      >
        <span
          title={value}
          className={cn(
            'truncate font-mono text-[14px] font-normal tabular-nums text-[#12161950]',
            value && 'text-[#242A2E]',
            value && 'font-bold',
            value && 'font-mono tabular-nums'
          )}
        >
          {value ? value : 'Enter Recipient Address'}
        </span>
        <span className="flex h-[22px] w-[22px] cursor-pointer items-center justify-center">
          <Image src="/images/edit.svg" alt="edit" width={16} height={16} />
        </span>
      </div>
      {error && <div className="mt-1 text-xs">{error}</div>}

      <RecipientModal
        value={value}
        chain={chain}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={onChange}
      />
    </div>
  );
}
