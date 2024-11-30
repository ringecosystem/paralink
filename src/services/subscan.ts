interface SubscanResponse {
  code: number;
  message: string;
  generated_at: number;
  data: {
    hash_type: string;
    messages: Array<{
      unique_id: string;
    }>;
  };
}

interface CheckHashParams {
  hash: string;
  maxRetries?: number;
  retryDelay?: number;
}

export async function checkTransactionHash({
  hash,
  maxRetries = 20,
  retryDelay = 3000
}: CheckHashParams): Promise<string | undefined> {
  const API_KEY = process.env.NEXT_PUBLIC_SUBSCAN_API_KEY;
  if (!API_KEY) {
    console.error('Subscan API key is not configured');
    return undefined;
  }

  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const response = await fetch(
        'https://polkadot.api.subscan.io/api/scan/check_hash',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
          },
          body: JSON.stringify({ hash }),
          cache: 'no-store',
          next: {
            revalidate: 0
          }
        }
      );

      const data = (await response.json()) as SubscanResponse;
      console.log('Subscan response:', data);
      //   此处有重大的问题，假设这个 length 不为空，很可能是因为已经有值，但是其实我最新的值并没有生成呢，所以获取的其实是旧的值，这肯定是不对的，不知道如何解决，待确认。
      if (data.code === 0 && data.data?.messages?.length > 0) {
        const lastMessage = data.data.messages[data.data.messages.length - 1];
        return lastMessage.unique_id;
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    } catch (error) {
      console.error('Error checking transaction hash:', error);
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  return undefined;
}

export type { SubscanResponse };
