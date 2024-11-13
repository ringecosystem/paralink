'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Wallets } from './wallets';
import { History } from './history';

export const Tabs = () => {
  const [activeTab, setActiveTab] = useState<'wallet' | 'history'>('wallet');

  return (
    <div className="w-[calc(100vw-40px)] rounded-[10px] bg-white p-[10px] md:w-[300px]">
      <div className="relative flex w-full items-center justify-between text-[12px] text-[#FF0083]">
        <div
          className={cn(
            'w-1/2 cursor-pointer text-center leading-normal text-[#FF0083] transition-opacity hover:opacity-80',
            activeTab === 'wallet' && 'font-bold'
          )}
          onClick={() => setActiveTab('wallet')}
        >
          Wallet
        </div>
        <div
          className={cn(
            'w-1/2 cursor-pointer text-center leading-normal text-[#FF0083] transition-opacity hover:opacity-80',
            activeTab === 'history' && 'font-bold'
          )}
          onClick={() => setActiveTab('history')}
        >
          History
        </div>
      </div>

      <div className="my-[10px] h-[1px] w-full bg-[#F2F3F5]" />

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'wallet' && <Wallets />}
        {activeTab === 'history' && <History />}
      </motion.div>
    </div>
  );
};
