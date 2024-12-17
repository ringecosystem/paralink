'use client';
import { Button } from '@/components/ui/button';

export default function Error() {
  return (
    <div className="container flex flex-col gap-[30px] pt-[min(120px,15vh)] md:pt-[min(100px,12vh)]">
      <div className="mx-auto flex w-full flex-col items-center gap-6 rounded-[var(--radius)] bg-white p-6 text-center shadow-sm md:w-[460px] md:rounded-[var(--radius-lg)]">
        <div className="rounded-full bg-red-50 p-4">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Failed to Load
          </h3>
          <p className="text-sm text-gray-500">
            Unable to fetch required data. Please check your network connection
            and try again.
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reload
        </Button>
      </div>
    </div>
  );
}
