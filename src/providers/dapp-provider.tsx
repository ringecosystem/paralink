'use client';

import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { APP_NAME } from '@/config/site';
import { createDynamicConfig, defaultConfig } from '@/config/wagmi';
import { useWagmiChainStore } from '@/store/wagmiChain';

import AppQueryClientProvider from './query-client-provider';

import type { PropsWithChildren } from 'react';

import '@rainbow-me/rainbowkit/styles.css';

export const light = lightTheme({
  borderRadius: 'medium',
  accentColor: 'hsl(var(--primary))'
});
export function DAppProvider({ children }: PropsWithChildren<unknown>) {
  const { currentChain } = useWagmiChainStore();
  const config = currentChain
    ? createDynamicConfig(currentChain)
    : defaultConfig;

  return (
    <WagmiProvider config={config}>
      <AppQueryClientProvider>
        <RainbowKitProvider
          theme={light}
          locale="en-US"
          appInfo={{ appName: APP_NAME }}
        >
          {children}
        </RainbowKitProvider>
      </AppQueryClientProvider>
    </WagmiProvider>
  );
}
