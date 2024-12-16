import { createJsonResourceLoader } from "./resource-loader";

export async function fetchRegistry() {
  const response = await createJsonResourceLoader({
    preferredCDN: 'github-raw',

  })
  return response.fetchJson({
    owner: 'ringecosystem',
    repo: 'paralink',
    branch: 'main',
    path: 'xcm-chain-registry-builder/dist/transformed-chain-registry.json'
  })
}
