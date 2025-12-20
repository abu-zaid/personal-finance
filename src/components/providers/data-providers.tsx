'use client';

import { ReactNode } from 'react';
import { CategoriesProvider } from '@/context/categories-context';
import { TransactionsProvider } from '@/context/transactions-context';
import { BudgetsProvider } from '@/context/budgets-context';
import { GoalsProvider } from '@/context/goals-context';
import { RecurringProvider } from '@/context/recurring-context';

interface DataProvidersProps {
  children: ReactNode;
}

export function DataProviders({ children }: DataProvidersProps) {
  return (
    <CategoriesProvider>
      <TransactionsProvider>
        <BudgetsProvider>
          <GoalsProvider>
            <RecurringProvider>{children}</RecurringProvider>
          </GoalsProvider>
        </BudgetsProvider>
      </TransactionsProvider>
    </CategoriesProvider>
  );
}
