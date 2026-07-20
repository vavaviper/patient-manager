'use client';

import { Toaster } from '@/components/ui/sonner';

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-xl shadow-lg border',
        },
      }}
    />
  );
}
