'use client';

import { useEffect, useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface FallbackImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null;
  fallbackSrc: string;
}

export function FallbackImage({
  src,
  fallbackSrc,
  alt,
  ...props
}: FallbackImageProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  return (
    <Image
      src={error || !src ? fallbackSrc : src}
      alt={alt}
      onError={() => setError(true)}
      {...props}
    />
  );
}