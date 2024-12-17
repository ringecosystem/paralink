import { API_CACHE_TIME } from '@/config/cache';

interface ResourceSource {
  baseUrl: string;
  type: 'github-raw' | 'jsdelivr' | 'statically';
  priority: number;
  buildUrl: (
    owner: string,
    repo: string,
    branch: string,
    path: string
  ) => string;
}

interface ResourceConfig {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

export function createJsonResourceLoader(options?: {
  preferredCDN?: 'github-raw' | 'jsdelivr' | 'statically';
}) {
  const sources: ResourceSource[] = [
    {
      baseUrl: 'https://raw.githubusercontent.com',
      type: 'github-raw',
      priority: options?.preferredCDN === 'github-raw' ? 0 : 1,
      buildUrl: (owner, repo, branch, path) =>
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
    },
    {
      baseUrl: 'https://cdn.jsdelivr.net/gh',
      type: 'jsdelivr',
      priority: options?.preferredCDN === 'jsdelivr' ? 0 : 2,
      buildUrl: (owner, repo, branch, path) =>
        `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`
    },
    {
      baseUrl: 'https://cdn.statically.io/gh',
      type: 'statically',
      priority: options?.preferredCDN === 'statically' ? 0 : 3,
      buildUrl: (owner, repo, branch, path) =>
        `https://cdn.statically.io/gh/${owner}/${repo}/${branch}/${path}`
    }
  ];

  async function fetchJson<T>(config: ResourceConfig): Promise<T> {
    const sortedSources = [...sources].sort((a, b) => a.priority - b.priority);

    for (const source of sortedSources) {
      try {
        const url = source.buildUrl(
          config.owner,
          config.repo,
          config.branch,
          config.path
        );
        console.log('get url', url);
        const response = await fetch(url, {
          next: {
            revalidate: API_CACHE_TIME
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: T = await response.json();

        return data;
      } catch (error) {
        console.error(`Failed to fetch from ${source.type}:`, error);
        continue;
      }
    }

    throw new Error(`Failed to load resource: ${config.path} from all sources`);
  }

  return {
    fetchJson
  };
}
