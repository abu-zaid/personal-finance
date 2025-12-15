'use client';

import { ReactNode } from 'react';
import { CategoriesProvider } from '@/context/categories-context';
import { TransactionsProvider } from '@/context/transactions-context';
import { BudgetsProvider } from '@/context/budgets-context';

interface DataProvidersProps {
  children: ReactNode;
}

export function DataProviders({ children }: DataProvidersProps) {
  return (
    <CategoriesProvider>
      <TransactionsProvider>
        <BudgetsProvider>{children}</BudgetsProvider>
      </TransactionsProvider>
    </CategoriesProvider>
  );
}
