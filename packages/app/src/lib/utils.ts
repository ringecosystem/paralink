import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isEthereumAddress } from '@polkadot/util-crypto';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { sortEndpoints } from '@/utils/endpoint';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ValidateAddressParams {
  address: string;
  chainType: 'evm' | 'substrate';
  expectedPrefix?: number;
}

export function isValidAddress({
  address,
  chainType,
  expectedPrefix
}: ValidateAddressParams) {
  try {
    if (chainType === 'evm') return isEthereumAddress(address);

    if (chainType === 'substrate') {
      const decoded = decodeAddress(address);
      if (decoded.length !== 32) return false;

      if (expectedPrefix !== undefined) {
        try {
          const encodedWithPrefix = encodeAddress(decoded, expectedPrefix);
          return address === encodedWithPrefix;
        } catch {
          return false;
        }
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error(`Invalid ${chainType} address: ${address}`, error);
    return false;
  }
}

export const convertToEvmRpcUrls = (providers: string[]) => {
  const httpUrls: string[] = [];

  providers.forEach((url) => {
    if (url.startsWith('wss://')) {
      httpUrls.push(url.replace('wss://', 'https://'));
    } else {
      httpUrls.push(url);
    }
  });

  return {
    default: {
      http: sortEndpoints(httpUrls)
    }
  };
};

export function toShortAddress(address: string) {
  return address.length > 16
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address;
}
