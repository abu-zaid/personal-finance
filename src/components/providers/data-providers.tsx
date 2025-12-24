'use client';

import { ReactNode } from 'react';
import { GoalsProvider } from '@/context/goals-context';
// import { RecurringProvider } from '@/context/recurring-context'; // Removed

interface DataProvidersProps {
  children: ReactNode;
}

export function DataProviders({ children }: DataProvidersProps) {
  return (
    <GoalsProvider>
      {/* Recurring is now Redux */}
      {children}
    </GoalsProvider>
  );
}
