'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryIcon } from '@/components/features/categories/category-icon';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Transaction, Category } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  category: Category | undefined;
}

function TransactionItem({ transaction, category }: TransactionItemProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {category && (
          <CategoryIcon icon={category.icon} color={category.color} size="sm" />
        )}
        <div>
          <p className="text-sm font-medium">
            {transaction.notes || category?.name || 'Expense'}
          </p>
          <p className="text-muted-foreground text-xs">
            {formatDate(transaction.date)}
          </p>
        </div>
      </div>
      <span className="text-sm font-medium text-red-600 dark:text-red-400">
        -{formatCurrency(transaction.amount)}
      </span>
    </div>
  );
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  limit?: number;
}

export function RecentTransactions({
  transactions,
  categories,
  limit = 5,
}: RecentTransactionsProps) {
  const getCategoryById = (id: string) => categories.find((c) => c.id === id);

  // Sort by date (most recent first) and limit
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/transactions" className="flex items-center gap-1">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recentTransactions.length > 0 ? (
          <div className="divide-y">
            {recentTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                category={getCategoryById(transaction.categoryId)}
              />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground py-8 text-center text-sm">
            No transactions yet. Add your first expense!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
