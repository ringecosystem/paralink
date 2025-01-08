import { createJsonResourceLoader } from './resource-loader';

async function fetchLatestTag(owner: string, repo: string): Promise<string> {
  const token = process.env.GITHUB_TOKEN;
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/tags`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tags: ${response.statusText}`);
  }

  const tags = await response.json();
  if (!tags.length) {
    throw new Error('No tags found');
  }

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
