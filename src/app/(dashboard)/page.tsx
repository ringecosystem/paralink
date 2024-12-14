export const dynamic = 'force-dynamic';
import { fetchRegistry } from '@/utils/fetch-register';
import Dashboard from './_components/dashboard';

import type { ChainRegistry } from '@/types/xcm-asset';

export default async function Page() {
  const registryAssets = await fetchRegistry();

  return (
    <Dashboard registryAssets={registryAssets as unknown as ChainRegistry} />
  );
}
