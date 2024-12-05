interface SubscanApiConfig {
  baseUrl: string;
}

const SUBSCAN_API_CONFIG: Record<number, SubscanApiConfig> = {
  0: {
    baseUrl: 'https://polkadot.api.subscan.io'
  },
  1000: {
    baseUrl: 'https://assethub-polkadot.api.subscan.io'
  },
  2000: {
    baseUrl: 'https://acala.api.subscan.io'
  },
  2002: {
    baseUrl: 'https://clover.api.subscan.io'
  },
  2004: {
    baseUrl: 'https://moonbeam.api.subscan.io'
  },
  2006: {
    baseUrl: 'https://astar.api.subscan.io'
  },
  2008: {
    baseUrl: 'https://crust.api.subscan.io'
  },
  2019: {
    baseUrl: 'https://composable.api.subscan.io'
  },
  2025: {
    baseUrl: 'https://sora.api.subscan.io'
  },
  2026: {
    baseUrl: 'https://nodle.api.subscan.io'
  },
  2030: {
    baseUrl: 'https://bifrost.api.subscan.io'
  },
  2031: {
    baseUrl: 'https://centrifuge.api.subscan.io'
  },
  2032: {
    baseUrl: 'https://interlay.api.subscan.io'
  },
  2034: {
    baseUrl: 'https://hydradx.api.subscan.io'
  },
  2035: {
    baseUrl: 'https://phala.api.subscan.io'
  },
  2037: {
    baseUrl: 'https://unique.api.subscan.io'
  },
  2039: {
    baseUrl: 'https://integritee.api.subscan.io'
  },
  2040: {
    baseUrl: 'https://polkadex-parachain.api.subscan.io'
  },
  2046: {
    baseUrl: 'https://darwinia.api.subscan.io'
  },
  2051: {
    baseUrl: 'https://ajuna.api.subscan.io'
  },
  2086: {
    baseUrl: 'https://spiritnet.api.subscan.io'
  },
  2092: {
    baseUrl: 'https://zeitgeist.api.subscan.io'
  },
  2094: {
    baseUrl: 'https://pendulum.api.subscan.io'
  },
  2104: {
    baseUrl: 'https://manta.api.subscan.io'
  },
  3338: {
    baseUrl: 'https://peaq.api.subscan.io'
  },
  3346: {
    baseUrl: 'https://continuum.api.subscan.io'
  },
  3359: {
    baseUrl: 'https://integritee.api.subscan.io'
  },
  3388: {
    baseUrl: 'https://robonomics.api.subscan.io'
  }
};

export function getSubscanApiConfig(paraId: number): SubscanApiConfig {
  const config = SUBSCAN_API_CONFIG[paraId];
  if (!config)
    throw new Error(`No Subscan API configuration found for paraId: ${paraId}`);
  return config;
}

export function getSubscanBaseUrl(paraId: number): string {
  return getSubscanApiConfig(paraId).baseUrl;
}
