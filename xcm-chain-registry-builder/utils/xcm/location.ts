import { isEqual } from 'lodash-es';
import { ReserveType } from '../../types/enum';

function normalizeGeneralKey(key: any): string {
    if (typeof key === 'string') {
        return key.toLowerCase();
    }
    if (key?.data) {
        return key.data.substring(0, 6).toLowerCase();
    }
    return '';
}

const processInterior = (interior: any) => {
    const processItem = (item: any) => {
        if (Array.isArray(item) && item[0]?.generalKey) {
            return {
                generalKey: normalizeGeneralKey(item[0].generalKey)
            };
        }
        return item;
    };
    if (interior.x1) {
        return [processItem(interior.x1)];
    }
    if (interior.x2) {
        return interior.x2.map(processItem);
    }
    if (interior.x3) {
        return interior.x3.map(processItem);
    }
    if (interior.x4) {
        return interior.x4.map(processItem);
    }
    return [];
};

function parseXcmLocation(xcmLocation: string) {
    try {
        const location = JSON.parse(xcmLocation);
        const interior = location?.v1?.interior;
        if (!interior) return null;
        return {
            parents: location.v1.parents,
            interior: processInterior(interior)
        };
    } catch (e) {
        console.error('Failed to parse XCM location:', e);
        return null;
    }
}

export function isSameLocation(location1: string, location2: string): boolean {
    const parsed1 = parseXcmLocation(location1);
    const parsed2 = parseXcmLocation(location2);
    if (!parsed1 || !parsed2) return false;
    // if (parsed1.parents !== parsed2.parents) return false;
    if (parsed1.interior.length !== parsed2.interior.length) return false;
    return parsed1.interior.every((item1: any, index: number) => {
        const item2 = parsed2.interior[index];
        if (item1?.generalKey && item2?.generalKey) {
            return item1.generalKey === item2.generalKey;
        }
        return isEqual(item1, item2);
    });
}

export function hasParachainInLocation({
    multiLocationStr,
    paraId
}: {
    multiLocationStr: string;
    paraId: string;
}): boolean {

    try {
        let multiLocation: any;
        multiLocation = JSON.parse(multiLocationStr);
        if (typeof multiLocation === 'string') {
            multiLocation = JSON.parse(multiLocation);
        }
        const interior = multiLocation.v1.interior;
        const locationArray =
            interior.x1 || interior.x2 || interior.x3 || interior.x4 || [];
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


export function determineReserveType({
    sourceParaId,
    targetParaId,
    originChainReserveLocation
}: {
    sourceParaId: number | string;
    targetParaId: number | string;
    originChainReserveLocation?: string;
}): ReserveType {
    if (Number(targetParaId) === 1000) {
        return ReserveType.Foreign;
    }
    if (originChainReserveLocation) {
        try {
            const reserveLocation = JSON.parse(originChainReserveLocation);
            if (reserveLocation.parents === '0') return ReserveType.Local;
            if (reserveLocation.parents === '1') {
                if ('X1' in reserveLocation.interior) {
                    if (Number(reserveLocation.interior.X1.Parachain) === Number(targetParaId)) {
                        return ReserveType.Foreign;
                    }
                    return ReserveType.Remote;
                }
                if ('X2' in reserveLocation.interior && Array.isArray(reserveLocation.interior.X2)) {
                    if ((reserveLocation.interior.X2)?.some(v => {
                        return 'Parachain' in v && Number(v.Parachain) === Number(targetParaId)
                    })) {
                        return ReserveType.Foreign;
                    }
                    return ReserveType.Remote;
                }
                if ('X3' in reserveLocation.interior && Array.isArray(reserveLocation.interior.X3)) {
                    if ((reserveLocation.interior.X3)?.some(v => {
                        return 'Parachain' in v && Number(v.Parachain) === Number(targetParaId)
                    })) {
                        return ReserveType.Foreign;
                    }
                    return ReserveType.Remote;
                }
                if ('X4' in reserveLocation.interior && Array.isArray(reserveLocation.interior.X4)) {
                    if ((reserveLocation.interior.X4)?.some(v => {
                        return 'Parachain' in v && Number(v.Parachain) === Number(targetParaId)
                    })) {
                        return ReserveType.Foreign;
                    }
                    return ReserveType.Remote;
                }
                return ReserveType.Remote;
            }
        } catch (error) {
            return ReserveType.Remote;
        }

    }

    console.log('No reserve location found', sourceParaId, targetParaId);
    return ReserveType.Remote;
}

