'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { AlertProvider } from './AlertModal';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AlertProvider>
        {children}
      </AlertProvider>
    </SessionProvider>
  );
}
