'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedErrorMessageProps {
  show: boolean;
  message: string | React.ReactNode;
  className?: string;
}

export function AnimatedErrorMessage({
  show,
  message,
  className = ''
}: AnimatedErrorMessageProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cn('flex items-start justify-start gap-2 px-0', className)}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0 text-red-500"
          >
            <path
              d="M12 9V14M12 17.5V18M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs text-red-500">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
