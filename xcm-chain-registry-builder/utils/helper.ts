export function getValidWssEndpoints(providers: Record<string, string>): string[] {
    const endpoints = Object.values(providers)?.filter((provider) => provider.includes('wss://'));
    if (endpoints.length === 0) {
        throw new Error('No valid WSS endpoints found');
    }
    return endpoints;
}

export function hasParachainInLocation({
    multiLocationStr,
    paraId
}: {
    multiLocationStr: string;
    paraId: string;
}): boolean {


    try {
        const multiLocation = JSON.parse(multiLocationStr);
        const interior = multiLocation.v1.interior;
        const locationArray = interior.x1 || interior.x2 || interior.x3 || interior.x4 || [];
        return Array.isArray(locationArray)
            ? locationArray.some(
                (v: { [key: string]: string | number }) =>
                    'parachain' in v && v.parachain?.toString() === paraId
            )
            : 'parachain' in locationArray &&
            locationArray.parachain?.toString() === paraId;
    } catch (error) {
        console.error('Error parsing multiLocation:', error);
        return false;
    }
}

export function getGeneralIndex(multiLocationStr: string): string | null {
    try {
        const multiLocation = JSON.parse(multiLocationStr);
        const interior = multiLocation.v1?.interior;
        const locationArray = interior.x1 || interior.x2 || interior.x3 || [];

        const generalIndexObj = Array.isArray(locationArray)
            ? locationArray.find(
                (v: { [key: string]: string | number }) => 'generalIndex' in v
            )
            : 'generalIndex' in locationArray
                ? locationArray
                : null;

        return generalIndexObj?.generalIndex?.toString() || null;
    } catch (error) {
        console.error('Error parsing multiLocation for generalIndex:', error);
        return null;
    }
}