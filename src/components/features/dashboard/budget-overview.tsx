'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CategoryIcon } from '@/components/features/categories/category-icon';
import { cn, formatCurrency } from '@/lib/utils';
import { Budget, BudgetAllocation, Category } from '@/types';

interface AllocationItemProps {
  allocation: BudgetAllocation & { spent: number };
  category: Category | undefined;
}

function AllocationItem({ allocation, category }: AllocationItemProps) {
  const percentage = Math.min(100, (allocation.spent / allocation.amount) * 100);
  const isOverBudget = allocation.spent > allocation.amount;
  const remaining = allocation.amount - allocation.spent;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {category && (
            <CategoryIcon icon={category.icon} color={category.color} size="sm" />
          )}
          <span className="text-sm font-medium">{category?.name || 'Unknown'}</span>
        </div>
        <div className="text-right">
          <span
            className={cn('text-sm font-medium', {
              'text-destructive': isOverBudget,
            })}
          >
            {formatCurrency(allocation.spent)}
          </span>
          <span className="text-muted-foreground text-sm">
            {' '}
            / {formatCurrency(allocation.amount)}
          </span>
        </div>
      </div>
      <Progress
        value={percentage}
        className={cn('h-2', {
          '[&>div]:bg-green-500': percentage < 75,
          '[&>div]:bg-yellow-500': percentage >= 75 && percentage < 100,
          '[&>div]:bg-red-500': percentage >= 100,
        })}
      />
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{percentage.toFixed(0)}% used</span>
        <span
          className={cn({
            'text-green-600 dark:text-green-400': remaining > 0,
            'text-red-600 dark:text-red-400': remaining < 0,
            'text-muted-foreground': remaining === 0,
          })}
        >
          {remaining >= 0
            ? `${formatCurrency(remaining)} left`
            : `${formatCurrency(Math.abs(remaining))} over`}
        </span>
      </div>
    </div>
  );
}

interface BudgetOverviewProps {
  budget: Budget | undefined;
  categories: Category[];
  spendingByCategory: { categoryId: string; amount: number }[];
}

export function BudgetOverview({ budget, categories, spendingByCategory }: BudgetOverviewProps) {
  const getCategoryById = (id: string) => categories.find((c) => c.id === id);
  const getSpentForCategory = (id: string) =>
    spendingByCategory.find((s) => s.categoryId === id)?.amount ?? 0;

  if (!budget || budget.allocations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center text-sm">
            No budgets set up yet
          </div>
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
      <CardHeader>
        <CardTitle className="text-lg">Budget Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {topAllocations.map((allocation) => (
          <AllocationItem
            key={allocation.categoryId}
            allocation={allocation}
            category={getCategoryById(allocation.categoryId)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
