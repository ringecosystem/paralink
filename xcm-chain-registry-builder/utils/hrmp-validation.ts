import { ApiPromise, WsProvider } from '@polkadot/api';
import type { BN } from '@polkadot/util';

import type { ChainInfo, ChainConfig } from '../type';
import { getValidWssEndpoints } from './helper';

interface HrmpChannel {
  sender: number;
  recipient: number;
  maxCapacity: number;
  maxTotalSize: number;
  maxMessageSize: number;
  msgCount: number;
  totalSize: number;
  mqcHead: string | null;
  senderDeposit: number;
  recipientDeposit: number;
}

type HrmpChannels = {
  key: { sender: number; recipient: number };
  value: HrmpChannel;
}[];

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

async function createPolkadotApi(
  providers: Record<string, string>
): Promise<ApiPromise> {
  try {
    const endpoints = getValidWssEndpoints(providers);
    const provider = new WsProvider(endpoints);
    const api = await ApiPromise.create({ provider });
    await api.isReady;
    return api;
  } catch (error) {
    throw new Error(`Failed to create Polkadot API: ${error}`);
  }
}

async function getHrmpChannels(api: ApiPromise) {
  try {
    const entries = await api.query.hrmp.hrmpChannels.entries();
    return entries.map(([key, value]) => {
      const [{ sender, recipient }] = key.args as unknown as [
        { sender: BN; recipient: BN }
      ];

      return {
        key: {
          sender: sender.toNumber(),
          recipient: recipient.toNumber()
        },
        value: value.toJSON() as unknown as HrmpChannel
      };
    });
  } catch (error) {
    throw new Error(`Failed to fetch HRMP channel information: ${error}`);
  }
}

function validateChannels(
  sourceParaId: number,
  destParaId: number,
  hrmpChannels: HrmpChannels
): ValidationResult {
  const sourceToDestChannel = hrmpChannels.find(
    (channel) =>
      channel.key.sender === sourceParaId &&
      channel.key.recipient === destParaId
  );

  const destToSourceChannel = hrmpChannels.find(
    (channel) =>
      channel.key.sender === destParaId &&
      channel.key.recipient === sourceParaId
  );

  if (!sourceToDestChannel)
    return {
      isValid: false,
      error: `Channel from source chain ${sourceParaId} to destination chain ${destParaId} does not exist`
    };

  if (!destToSourceChannel)
    return {
      isValid: false,
      error: `Channel from destination chain ${destParaId} to source chain ${sourceParaId} does not exist`
    };

  return { isValid: true };
}
interface FilterHrmpConnectionsParams {
  polkadotAssetRegistry: ChainConfig;
  chainsInfo: ChainInfo[];
}

export async function filterHrmpConnections({
  polkadotAssetRegistry,
  chainsInfo
}: FilterHrmpConnectionsParams): Promise<ChainConfig> {
  try {
    const polkadotChain = chainsInfo.find((chain) => chain.name === 'Polkadot');
    if (!polkadotChain || !polkadotChain.providers)
      throw new Error('Polkadot chain information or providers not found');

    const api = await createPolkadotApi(polkadotChain.providers);
    const hrmpChannels = await getHrmpChannels(api);

    const filteredRegistry: ChainConfig = {};

    for (const [paraId, chainData] of Object.entries(polkadotAssetRegistry)) {
      const otherParaIds = Object.keys(polkadotAssetRegistry).filter(
        (id) => id !== paraId
      );

      const hasValidConnections = otherParaIds.some((otherParaId) => {
        const validationResult = validateChannels(
          Number(paraId),
          Number(otherParaId),
          hrmpChannels
        );
        return validationResult.isValid;
      });

      if (hasValidConnections) {
        filteredRegistry[paraId] = chainData;
      }
    }
    await api.disconnect();

    return filteredRegistry;
  } catch (error) {
    throw new Error(
      `Failed to filter HRMP connections: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
