'use client';

import Image from 'next/image';
// import ConnectWallet from './connect-wallet';
import Link from 'next/link';
import ConnectWallet from './connect-wallet';

export default function Header() {
  return (
    <div className="container flex h-full items-center justify-between">
      <Link href="/" className="relative h-[24px] w-[80px]">
        <Image src="/images/logo.svg" alt="logo" fill />
      </Link>
      <ConnectWallet />
    </div>
  );
}
