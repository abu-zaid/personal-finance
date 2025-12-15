'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryIcon } from '@/components/features/categories/category-icon';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Transaction, Category } from '@/types';

interface TransactionItemProps {
  transaction: Transaction;
  category: Category | undefined;
  index: number;
}

function TransactionItem({ transaction, category, index }: TransactionItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="flex items-center justify-between py-3 gap-2"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-card border border-border">
          {category && (
            <CategoryIcon icon={category.icon} color={category.color} size="sm" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {transaction.notes || category?.name || 'Expense'}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {formatDate(transaction.date)}
          </p>
        </div>
      </div>
      <span className="text-sm font-semibold text-destructive flex-shrink-0">
        -{formatCurrency(transaction.amount)}
      </span>
    </motion.div>
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
        <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
        <Link 
          href="/transactions" 
          className="flex items-center gap-1 text-xs font-medium text-primary"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-border">
            {recentTransactions.map((transaction, index) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                category={getCategoryById(transaction.categoryId)}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground py-6 text-center text-sm">
            No transactions yet. Add your first expense!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
