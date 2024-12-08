import { getSubscanBaseUrl } from '@/config/subscan-api';
import { SubscanExtrinsicResponse } from '@/types/subscan';

// 定义结果枚举
export enum XcmMessageStatus {
  SUCCESS = 'SUCCESS',
  INVALID_PARA_ID = 'INVALID_PARA_ID',
  EXTRINSIC_FAILED = 'EXTRINSIC_FAILED',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 定义返回类型接口
export interface XcmMessageResult {
  status: XcmMessageStatus;
  message: string;
  hash?: string; // 只有在成功时才会有 hash
}

async function fetchXcmMessageHash(
  hash: string,
  paraId: number
): Promise<SubscanExtrinsicResponse> {
  const API_KEY = process.env.NEXT_PUBLIC_SUBSCAN_API_KEY;
  if (!API_KEY) throw new Error('Subscan API key is not configured');

  const baseUrl = getSubscanBaseUrl(paraId);
  if (!baseUrl) {
    throw new Error(`Invalid paraId: ${paraId}`);
  }

  try {
    const response = await fetch(`${baseUrl}/api/scan/extrinsic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({ hash }),
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    // 添加响应状态检查
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // 不再抛出错误，而是返回一个表示临时错误的响应
    return {
      code: -1,
      message: error instanceof Error ? error.message : 'Network error',
      data: null
    };
  }
}

interface GetXcmMessageHashParams {
  hash: string;
  paraId: number;
  maxRetries?: number;
  retryDelay?: number;
}
export async function getXcmMessageHash({
  hash,
  paraId,
  maxRetries = POLLING_CONFIG.MAX_RETRIES,
  retryDelay = POLLING_CONFIG.RETRY_DELAY
}: GetXcmMessageHashParams): Promise<XcmMessageResult> {
  const baseUrl = getSubscanBaseUrl(paraId);
  if (!baseUrl) {
    return {
      status: XcmMessageStatus.INVALID_PARA_ID,
      message: `Invalid paraId: ${paraId}`
    };
  }

  let attempts = 0;

  while (attempts < maxRetries) {
    const data = await fetchXcmMessageHash(hash, paraId);
    console.log('Polling Subscan response:', data);

    // 如果是网络错误或临时错误，继续重试
    if (data.code === -1) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      continue;
    }

    if (data.code === 0 && data.data?.event) {
      // 检查是否有 ExtrinsicFailed 事件
      const extrinsicFailed = data.data.event.find(
        (event) => event.event_id === 'ExtrinsicFailed'
      );

      if (extrinsicFailed && data.data.finalized) {
        return {
          status: XcmMessageStatus.EXTRINSIC_FAILED,
          message: 'Transaction failed: ExtrinsicFailed event detected'
        };
      }

      // 查找 XcmpMessageSent 事件并解析其参数
      const xcmpMessageSent = data.data.event.find(
        (event) =>
          event.event_id === 'XcmpMessageSent' &&
          event.module_id === 'xcmpqueue' &&
          event.finalized === true
      );

      if (xcmpMessageSent) {
        try {
          const params =
            typeof xcmpMessageSent.params === 'string'
              ? JSON.parse(xcmpMessageSent.params)
              : undefined;
          const messageHashParam = params
            ? params.find(
                (param: any) =>
                  param.type_name === 'XcmHash' && param.name === 'message_hash'
              )
            : undefined;

          if (messageHashParam?.value) {
            return {
              status: XcmMessageStatus.SUCCESS,
              message: 'Transaction successful',
              hash: messageHashParam.value
            };
          }
        } catch (error) {
          console.error('Error parsing XcmpMessageSent params:', error);
        }
      }
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
  }

  return {
    status: XcmMessageStatus.TIMEOUT,
    message: `Timeout after ${maxRetries} attempts`
  };
}

export interface SubscanResponse {
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

// 添加常量配置
const POLLING_CONFIG = {
  MAX_RETRIES: 20,
  RETRY_DELAY: 3000
} as const;

interface CheckHashParams {
  hash: string;
  maxRetries?: number;
  retryDelay?: number;
}

async function fetchXcmUniqueId(hash: string): Promise<SubscanResponse> {
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
  maxRetries = POLLING_CONFIG.MAX_RETRIES,
  retryDelay = POLLING_CONFIG.RETRY_DELAY
}: CheckHashParams): Promise<string | undefined> {
  let attempts = 0;
  let initialMessageId: string | undefined;

  try {
    const data = await fetchXcmUniqueId(hash);
    console.log('Initial Subscan response:', data);

    if (data.code === 0 && data.data?.messages?.length > 0) {
      initialMessageId =
        data.data.messages[data.data.messages.length - 1].unique_id;
      console.log('Initial message ID:', initialMessageId);
    }
  } catch (error) {
    console.error('Error getting initial state:', error);
  }

  while (attempts < maxRetries) {
    try {
      const data = await fetchXcmUniqueId(hash);
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

interface CheckXcmTransactionParams {
  hash: string;
  paraId: number;
  maxRetries?: number;
  retryDelay?: number;
}

export async function checkXcmTransaction({
  hash,
  paraId,
  maxRetries = POLLING_CONFIG.MAX_RETRIES,
  retryDelay = POLLING_CONFIG.RETRY_DELAY
}: CheckXcmTransactionParams): Promise<XcmMessageResult> {
  console.log('checkXcmTransaction', hash, paraId);
  const xcmResult = await getXcmMessageHash({
    hash,
    paraId,
    maxRetries,
    retryDelay
  });
  console.log('xcmResult', xcmResult);

  if (xcmResult.status !== XcmMessageStatus.SUCCESS) {
    return {
      status: xcmResult.status,
      message: xcmResult.message
    };
  }

  const uniqueId = await checkTransactionHash({
    hash: xcmResult.hash!,
    maxRetries,
    retryDelay
  });
  console.log('uniqueId', uniqueId);
  if (!uniqueId) {
    return {
      status: XcmMessageStatus.TIMEOUT,
      message: 'Failed to get unique ID for XCM message'
    };
  }

  return {
    status: XcmMessageStatus.SUCCESS,
    message: 'XCM message processed successfully',
    hash: uniqueId
  };
}
