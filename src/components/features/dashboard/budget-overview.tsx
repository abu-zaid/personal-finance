'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CategoryIcon } from '@/components/features/categories/category-icon';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';
import { Budget, BudgetAllocation, Category } from '@/types';

interface AllocationItemProps {
  allocation: BudgetAllocation & { spent: number };
  category: Category | undefined;
  formatCurrency: (amount: number) => string;
  symbol: string;
  index: number;
}

function AllocationItem({ allocation, category, formatCurrency, symbol, index }: AllocationItemProps) {
  const percentage = Math.min(100, (allocation.spent / allocation.amount) * 100);
  const isOverBudget = allocation.spent > allocation.amount;
  const remaining = allocation.amount - allocation.spent;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {category && (
            <CategoryIcon icon={category.icon} color={category.color} size="sm" />
          )}
          <span className="text-sm font-medium truncate">{category?.name || 'Unknown'}</span>
        </div>
        <div className="text-right flex-shrink-0 flex items-baseline gap-1">
          <span
            className={cn('text-sm font-semibold', {
              'text-red-400': isOverBudget,
            })}
          >
            {formatCurrency(allocation.spent)}
          </span>
          <span className="text-muted-foreground/60 text-[10px]">
            /{formatCurrency(allocation.amount)}
          </span>
        </div>
      </div>
      <Progress
        value={percentage}
        className={cn('h-2', {
          '[&>div]:bg-primary [&>div]:shadow-[0_0_8px_rgba(152,239,90,0.4)]': percentage < 75,
          '[&>div]:bg-yellow-500 [&>div]:shadow-[0_0_8px_rgba(234,179,8,0.4)]': percentage >= 75 && percentage < 100,
          '[&>div]:bg-red-400 [&>div]:shadow-[0_0_8px_rgba(248,113,113,0.4)]': percentage >= 100,
        })}
      />
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground/60">{percentage.toFixed(0)}% used</span>
        <span
          className={cn('font-medium', {
            'text-primary': remaining > 0,
            'text-red-400': remaining < 0,
            'text-muted-foreground/60': remaining === 0,
          })}
        >
          {remaining >= 0
            ? `${symbol}${Math.round(remaining)} left`
            : `${symbol}${Math.round(Math.abs(remaining))} over`}
        </span>
      </div>
    </motion.div>
  );
}

interface BudgetOverviewProps {
  budget: Budget | undefined;
  categories: Category[];
  spendingByCategory: { categoryId: string; amount: number }[];
}

export function BudgetOverview({ budget, categories, spendingByCategory }: BudgetOverviewProps) {
  const { formatCurrency, symbol } = useCurrency();
  const getCategoryById = (id: string) => categories.find((c) => c.id === id);
  const getSpentForCategory = (id: string) =>
    spendingByCategory.find((s) => s.categoryId === id)?.amount ?? 0;

  // No budget at all
  if (!budget) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Budget Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-6 text-center text-sm">
            No budget set for this month
          </div>
        </CardContent>
      </Card>
    );
  }

  // Budget exists but no category allocations - show overall budget
  if (budget.allocations.length === 0) {
    const totalSpent = spendingByCategory.reduce((sum, s) => sum + s.amount, 0);
    const percentage = Math.min(100, (totalSpent / budget.totalAmount) * 100);
    const remaining = budget.totalAmount - totalSpent;

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Budget Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Budget</span>
            <span className="font-semibold">{formatCurrency(budget.totalAmount)}</span>
          </div>
          <Progress
            value={percentage}
            className={cn('h-2.5', {
              '[&>div]:bg-primary': percentage < 75,
              '[&>div]:bg-yellow-500': percentage >= 75 && percentage < 100,
              '[&>div]:bg-red-400': percentage >= 100,
            })}
          />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{formatCurrency(totalSpent)} spent</span>
            <span className={cn('font-medium', remaining >= 0 ? 'text-primary' : 'text-red-400')}>
              {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
            </span>
          </div>
          <p className="text-muted-foreground/60 text-xs text-center pt-2">
            Add category allocations in Budgets to track by category
          </p>
        </CardContent>
      </Card>
    );
  }

  // Add spent data to allocations and sort by percentage used
  const allocationsWithSpent = budget.allocations.map((alloc) => ({
    ...alloc,
    spent: getSpentForCategory(alloc.categoryId),
  }));

  const sortedAllocations = [...allocationsWithSpent].sort((a, b) => {
    const aPercent = a.spent / a.amount;
    const bPercent = b.spent / b.amount;
    return bPercent - aPercent;
  });

  // Show top 5 allocations
  const topAllocations = sortedAllocations.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold tracking-tight">Budget Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topAllocations.map((allocation, index) => (
          <AllocationItem
            key={allocation.categoryId}
            allocation={allocation}
            category={getCategoryById(allocation.categoryId)}
            formatCurrency={formatCurrency}
            symbol={symbol}
            index={index}
          />
        ))}
      </CardContent>
    </Card>
  );
}
