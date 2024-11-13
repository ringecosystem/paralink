import { mainnet } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

import { APP_NAME, PROJECT_ID } from './site';
import type { Chain } from 'wagmi/chains';

if (!PROJECT_ID) throw new Error('Project ID is not defined');

const baseConfig = {
  appName: APP_NAME,
  projectId: PROJECT_ID,

  ssr: true
};

export function createDynamicConfig(chain: Chain) {
  return getDefaultConfig({
    ...baseConfig,
    chains: [chain]
  });
}

export const defaultConfig = getDefaultConfig({
  ...baseConfig,
  chains: [mainnet]
});
