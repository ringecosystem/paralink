'use client';

import { useRouter } from 'next/navigation';
import ErrorDisplay from './error-display';

const NotFound = () => {
  const router = useRouter();
  return (
    <div className="flex h-[calc(100vh-var(--header-height)-var(--footer-height))] w-full items-center justify-center">
      <ErrorDisplay
        title="404"
        message="Sorry, Page not found"
        buttonText="Back to home >"
        action={() => router.push('/')}
      />
    </div>
  );
};

export default NotFound;
