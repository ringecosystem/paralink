// export function findBestWssEndpoint(
//   endpoints: Record<string, string>
// ): string | undefined {
//   const wssEndpoints = Object.entries(endpoints).filter(([, url]) =>
//     url.startsWith('wss://')
//   );

//   if (!wssEndpoints.length) return undefined;

//   const onfinality = wssEndpoints.find(([name]) =>
//     name.toLowerCase().includes('onfinality')
//   );
//   if (onfinality) return onfinality[1];

//   const dwellir = wssEndpoints.find(([name]) =>
//     name.toLowerCase().includes('dwellir')
//   );
//   if (dwellir) return dwellir[1];

//   return wssEndpoints[0][1];
// }

import PQueue from 'p-queue';

async function testWssConnection(url: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let isResolved = false;
    let ws: WebSocket | null = null;
    let timeoutId: NodeJS.Timeout;

    const cleanup = () => {
      if (ws) {
        ws.onopen = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.close();
        ws = null;
      }
      if (timeoutId) clearTimeout(timeoutId);
    };

    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          resolve(true);
        }
      };

      ws.onerror = () => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          resolve(false);
        }
      };

      ws.onclose = () => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          resolve(false);
        }
      };

      // 减少超时时间到 2 秒
      timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          resolve(false);
        }
      }, 2000);
    } catch (error) {
      console.error(`WebSocket connection error for ${url}:`, error);
      cleanup();
      resolve(false);
    }
  });
}

// export async function findBestWssEndpoint(
//   endpoints: Record<string, string>
// ): Promise<string | undefined> {
//   const wssEndpoints = Object.entries(endpoints).filter(([, url]) =>
//     url.startsWith('wss://')
//   );

//   if (!wssEndpoints.length) return undefined;
//   console.log('wssEndpoints', wssEndpoints);

//   const prioritizedEndpoints = [
//     wssEndpoints.find(([name]) => name.toLowerCase().includes('onfinality')),``
//     wssEndpoints.find(([name]) => name.toLowerCase().includes('dwellir')),
//     wssEndpoints[0]
//   ].filter((endpoint): endpoint is [string, string] => endpoint !== undefined);

//   console.log('prioritizedEndpoints', prioritizedEndpoints);

//   for (const endpoint of prioritizedEndpoints) {
//     const isConnectable = await testWssConnection(endpoint[1]);
//     if (isConnectable) return endpoint[1];
//   }

//   return undefined;
// }

export async function findBestWssEndpoint(
  endpoints: Record<string, string>
): Promise<string | undefined> {
  const wssEndpoints = Object.entries(endpoints)
    .filter(([, url]) => url.startsWith('wss://'))
    .map(([, url]) => url);

  if (wssEndpoints.length === 0) {
    return undefined;
  }
  console.log('wssEndpoints', wssEndpoints);
  const prioritizedUrls = wssEndpoints.sort((a, b) => {
    const getPriority = (url: string) => {
      if (url.toLowerCase().includes('onfinality')) return 1;
      if (url.toLowerCase().includes('dwellir')) return 2;
      return 3;
    };
    return getPriority(a) - getPriority(b);
  });
  console.log('prioritizedUrls', prioritizedUrls);
  const queue = new PQueue({ concurrency: 5 });
  let foundUrl: string | undefined;

  await Promise.any(
    prioritizedUrls.map((url) =>
      queue.add(async () => {
        if (foundUrl) return;
        const isConnectable = await testWssConnection(url);
        console.log('isConnectable', url, isConnectable);
        if (isConnectable && !foundUrl) {
          foundUrl = url;
          queue.clear();
        }
      })
    )
  );

  return foundUrl;
}
