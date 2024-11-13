interface RpcEndpointResult {
  url: string;
  isValid: boolean;
  latency?: number;
}

async function quickWsTest(
  url: string,
  timeout = 3000
): Promise<RpcEndpointResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const ws = new WebSocket(url);
    const timeoutId = setTimeout(() => {
      ws.close();
      resolve({ url, isValid: false });
    }, timeout);

    ws.onopen = () => {
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      ws.close();
      resolve({ url, isValid: true, latency });
    };

    ws.onerror = () => {
      clearTimeout(timeoutId);
      ws.close();
      resolve({ url, isValid: false });
    };
  });
}

export async function findBestWssEndpoint(
  endpoints: Record<string, string>,
  timeout = 3000
): Promise<string | undefined> {
  for (const provider of ['onfinality', 'dwellir']) {
    const matchedEndpoint = Object.entries(endpoints).find(([name]) =>
      name.toLowerCase().includes(provider)
    );

    if (matchedEndpoint) {
      const result = await quickWsTest(matchedEndpoint[1], timeout);
      if (result.isValid) return result.url;
    }
  }

  for (const url of Object.values(endpoints)) {
    const result = await quickWsTest(url, timeout);
    if (result.isValid) return result.url;
  }

  return undefined;
}
