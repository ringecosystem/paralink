'use client';

import Image from 'next/image';
// import ConnectWallet from './connect-wallet';
import Link from 'next/link';
import ConnectWallet from './connect-wallet';

export default function Header() {
  return (
    <div className="mx-auto flex h-full items-center justify-between px-[40px]">
      <Link href="/" className="relative h-[30px] w-[96px]">
        <Image src="/images/logo.svg" alt="logo" fill />
      </Link>
      <ConnectWallet />
    </div>
  );
}
