export async function filterWorkingWssProviders(providers: string[]): Promise<string[]> {
  const checkProvider = async (provider: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const ws = new WebSocket(provider);

      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 3000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        ws.close();
        resolve(false);
      };
    });
  };

  const results = await Promise.all(
    providers.map(provider => checkProvider(provider))
  );

  return providers.filter((_, index) => results[index]);
}

