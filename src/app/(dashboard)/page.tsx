export const dynamic = 'force-dynamic';
import transformedChainRegistry from '../../../xcm-chain-registry-builder/dist/transformed-chain-registry.json';
import Dashboard from './_components/dashboard';

import type { ChainRegistry } from '@/types/registry';

export default async function Page() {

  const registryAssets = transformedChainRegistry;


  return (
    <Dashboard
      registryAssets={registryAssets as unknown as ChainRegistry}
    />
  );
}
