import { mainnet } from 'wagmi/chains';
import { getDefaultConfig, getDefaultWallets } from '@rainbow-me/rainbowkit';

import { APP_NAME, PROJECT_ID } from './site';
import type { Chain } from 'wagmi/chains';
import {
  subWallet,
  talismanWallet,
} from '@rainbow-me/rainbowkit/wallets';

if (!PROJECT_ID) throw new Error('Project ID is not defined');

const baseConfig = {
  appName: APP_NAME,
  projectId: PROJECT_ID,

  ssr: true
};

const { wallets } = getDefaultWallets();
export function createDynamicConfig(chain: Chain) {
  return getDefaultConfig({
    ...baseConfig,
    chains: [chain],
    wallets: [
      ...wallets,
      {
        groupName: 'More',
        wallets: [subWallet, talismanWallet]
      }
    ]
  });
}

export const defaultConfig = getDefaultConfig({
  ...baseConfig,
  chains: [mainnet]
});
