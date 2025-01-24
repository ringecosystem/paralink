'use server';
import simpleGit from 'simple-git';
import { createJsonResourceLoader } from './resource-loader';

const git = simpleGit();

async function getRemoteTags(repoUrl) {
  try {
    const tags = await git.listRemote(['--tags', repoUrl]);

    const tagList = tags
      .split('\n')
      .filter((tag) => tag)
      .map((tag) => {
        const match = tag.match(/refs\/tags\/(.+)$/);
        return match ? match[1] : null;
      })
      .filter((tag) => tag)
      .map((tag) => tag?.replace(/\^\{\}$/, ''));

    return tagList;
  } catch (err) {
    console.error('Error fetching remote tags:', err);
    throw err;
  }
}

async function fetchLatestTag(repoUrl): Promise<string> {
  const tagsList = await getRemoteTags(repoUrl);
  if (tagsList.length) {
    return tagsList[tagsList.length - 1] as string;
  }
  return 'latest';
}

export async function fetchRegistry() {
  const response = await createJsonResourceLoader({
    preferredCDN: 'github-raw'
  });

  const latestTag = await fetchLatestTag(
    'https://github.com/ringecosystem/paralink.git'
  );

  return response.fetchJson({
    owner: 'ringecosystem',
    repo: 'paralink',
    branch: latestTag,
    path: 'output/transformed-chain-registry.json'
  });
}
