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

async function fetchSubscanHash(hash: string): Promise<SubscanResponse> {
  const API_KEY = process.env.NEXT_PUBLIC_SUBSCAN_API_KEY;
  if (!API_KEY) throw new Error('Subscan API key is not configured');

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
      next: { revalidate: 0 }
    }
  );

  return response.json();
}

export async function checkTransactionHash({
  hash,
  maxRetries = 20,
  retryDelay = 3000
}: CheckHashParams): Promise<string | undefined> {
  let attempts = 0;
  let initialMessageId: string | undefined;

  // 首次请求获取初始状态
  try {
    const data = await fetchSubscanHash(hash);
    console.log('Initial Subscan response:', data);

    if (data.code === 0 && data.data?.messages?.length > 0) {
      initialMessageId =
        data.data.messages[data.data.messages.length - 1].unique_id;
      console.log('Initial message ID:', initialMessageId);
    }
  } catch (error) {
    console.error('Error getting initial state:', error);
  }

  // 开始轮询检查新消息
  while (attempts < maxRetries) {
    try {
      const data = await fetchSubscanHash(hash);
      console.log('Polling Subscan response:', data);

      if (data.code === 0 && data.data?.messages?.length > 0) {
        const lastMessage = data.data.messages[data.data.messages.length - 1];

        if (!initialMessageId || lastMessage.unique_id !== initialMessageId) {
          return lastMessage.unique_id;
        }
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
