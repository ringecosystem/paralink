import { ApiPromise, WsProvider } from '@polkadot/api';
import { findBestWssEndpoint } from '@/utils/rpc-endpoint';
import type { ChainInfo } from '@/types/chains-info';
import type { BN } from '@polkadot/util';

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

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface ValidateHrmpConnectionParams {
  fromChainId: string;
  toChainId: string;
  chainsInfo: ChainInfo[];
}

async function createPolkadotApi(
  providers: Record<string, string>
): Promise<ApiPromise> {
  const bestEndpoint = await findBestWssEndpoint(providers);
  if (!bestEndpoint) throw new Error('No available Polkadot node found');

  const provider = new WsProvider(bestEndpoint);
  const api = await ApiPromise.create({ provider });
  await api.isReady;

  console.log(`Successfully connected to endpoint: ${bestEndpoint}`);
  return api;
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
  hrmpChannels: {
    key: { sender: number; recipient: number };
    value: HrmpChannel;
  }[]
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

export async function validateHrmpConnection({
  fromChainId,
  toChainId,
  chainsInfo
}: ValidateHrmpConnectionParams): Promise<ValidationResult> {
  try {
    const polkadotChain = chainsInfo.find((chain) => chain.name === 'Polkadot');
    if (!polkadotChain || !polkadotChain.providers)
      throw new Error('Polkadot chain information or providers not found');

    const api = await createPolkadotApi(polkadotChain.providers);

    const hrmpChannels = await getHrmpChannels(api);

    const validationResult = validateChannels(
      Number(fromChainId),
      Number(toChainId),
      hrmpChannels
    );

    // 6. 清理资源
    await api.disconnect();

    return validationResult;
  } catch (error) {
    return {
      isValid: false,
      error: `HRMP connection validation failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}