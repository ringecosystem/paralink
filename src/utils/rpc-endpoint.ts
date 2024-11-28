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

async function testWssConnection(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 3000); // 3秒超时

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    } catch {
      resolve(false);
    }
  });
}

export async function findBestWssEndpoint(
  endpoints: Record<string, string>
): Promise<string | undefined> {
  const wssEndpoints = Object.entries(endpoints).filter(([, url]) =>
    url.startsWith('wss://')
  );

  if (!wssEndpoints.length) return undefined;

  const prioritizedEndpoints = [
    wssEndpoints.find(([name]) => name.toLowerCase().includes('onfinality')),
    wssEndpoints.find(([name]) => name.toLowerCase().includes('dwellir')),
    wssEndpoints[0]
  ].filter((endpoint): endpoint is [string, string] => endpoint !== undefined);

  for (const endpoint of prioritizedEndpoints) {
    const isConnectable = await testWssConnection(endpoint[1]);
    if (isConnectable) return endpoint[1];
  }

  return undefined;
}
