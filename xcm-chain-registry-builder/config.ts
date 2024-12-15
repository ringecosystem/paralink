import { ParaId } from './types/enum';

// blacklisted ParaIds
export const BLACKLISTED_PARA_IDS = [
    ParaId.COLLECTIVES,
    ParaId.BRIDGE_HUB_POLKADOT,
    ParaId.PEOPLE,
    ParaId.CORETIME,
    ParaId.CLOVER,
    ParaId.TOTEM,
    ParaId.EQUILIBRIUM,
    ParaId.PARALLEL,
    ParaId.COMPOSABLE,
    ParaId.INTEGRITEE,
    ParaId.POLKADEX,
    ParaId.BITGREEN,
    ParaId.OAK,
];

// supported XCM ParaIds
export const SUPPORTED_XCM_PARA_IDS = [
    ParaId.ASSET_HUB_POLKADOT,
    ParaId.MOONBEAM,
    ParaId.ASTAR,
    ParaId.BIFROST,
    ParaId.HYDRATION,
];


