export function getValidWssEndpoints(providers: Record<string, string>): string[] {
    const endpoints = Object.values(providers)?.filter((provider) => provider.includes('wss://'));
    if (endpoints.length === 0) {
        throw new Error('No valid WSS endpoints found');
    }
    return endpoints;
}
