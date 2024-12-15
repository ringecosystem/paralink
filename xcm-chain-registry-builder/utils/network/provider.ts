export async function filterWorkingWssProviders(providers: string[]): Promise<string[]> {
    const checkProvider = async (provider: string): Promise<boolean> => {
        return new Promise((resolve) => {
            let ws: WebSocket | null = null;
            let isResolved = false;

            const safeResolve = (value: boolean) => {
                if (!isResolved) {
                    isResolved = true;
                    resolve(value);
                }
            };

            const cleanup = () => {
                if (ws) {
                    try {
                        ws.onopen = null;
                        ws.onerror = null;
                        ws.onclose = null;
                        ws.close();
                        ws = null;
                    } catch (error) {
                        console.error('Cleanup error:', error);
                    }
                }
            };

            try {
                ws = new WebSocket(provider);

                const timeout = setTimeout(() => {
                    cleanup();
                    safeResolve(false);
                }, 3000);

                ws.onopen = () => {
                    clearTimeout(timeout);
                    cleanup();
                    safeResolve(true);
                };

                ws.onerror = () => {
                    clearTimeout(timeout);
                    cleanup();
                    safeResolve(false);
                };

                ws.onclose = () => {
                    clearTimeout(timeout);
                    cleanup();
                    safeResolve(false);
                };

            } catch (error) {
                cleanup();
                safeResolve(false);
            }
        });
    };

    const concurrentLimit = 3;
    const workingProviders: string[] = [];

    for (let i = 0; i < providers.length; i += concurrentLimit) {
        const batch = providers.slice(i, i + concurrentLimit);

        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        try {
            await Promise.all(
                batch.map(async provider => {
                    try {
                        const isWorking = await checkProvider(provider);
                        if (isWorking) {
                            workingProviders.push(provider);
                        }
                    } catch (error) {
                        console.error(`Error checking provider ${provider}:`, error);
                    }
                })
            );
        } catch (error) {
            console.error('Batch processing error:', error);
        }
    }

    return workingProviders;
}

