import { createJsonResourceLoader } from './resource-loader';

async function fetchLatestTag(owner: string, repo: string): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/tags`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tags: ${response.statusText}`);
  }

  const tags = await response.json();
  if (!tags.length) {
    throw new Error('No tags found');
  }

  // 返回第一个 tag（最新的）
  return tags[0].name;
}

export async function fetchRegistry() {
  const response = await createJsonResourceLoader({
    preferredCDN: 'github-raw'
  });

  const latestTag = await fetchLatestTag('ringecosystem', 'paralink');

  console.log('latestTag', latestTag);

  return response.fetchJson({
    owner: 'ringecosystem',
    repo: 'paralink',
    branch: latestTag,
    path: 'output/transformed-chain-registry.json'
  });
}
