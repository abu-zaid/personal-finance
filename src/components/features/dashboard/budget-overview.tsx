'use client';

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
}

function AllocationItem({ allocation, category, formatCurrency, symbol }: AllocationItemProps) {
  const percentage = Math.min(100, (allocation.spent / allocation.amount) * 100);
  const isOverBudget = allocation.spent > allocation.amount;
  const remaining = allocation.amount - allocation.spent;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {category && (
            <CategoryIcon icon={category.icon} color={category.color} size="sm" />
          )}
          <span className="text-sm font-medium truncate">{category?.name || 'Unknown'}</span>
        </div>
        <div className="text-right flex-shrink-0">
          <span
            className={cn('text-xs font-medium', {
              'text-destructive': isOverBudget,
            })}
          >
            {formatCurrency(allocation.spent)}
          </span>
          <span className="text-muted-foreground text-xs">
            /{formatCurrency(allocation.amount)}
          </span>
        </div>
      </div>
      <Progress
        value={percentage}
        className={cn('h-1.5', {
          '[&>div]:bg-primary': percentage < 75,
          '[&>div]:bg-yellow-500': percentage >= 75 && percentage < 100,
          '[&>div]:bg-destructive': percentage >= 100,
        })}
      />
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">{percentage.toFixed(0)}% used</span>
        <span
          className={cn({
            'text-primary': remaining > 0,
            'text-destructive': remaining < 0,
            'text-muted-foreground': remaining === 0,
          })}
        >
          {remaining >= 0
            ? `${symbol}${Math.round(remaining)} left`
            : `${symbol}${Math.round(Math.abs(remaining))} over`}
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
  const { formatCurrency, symbol } = useCurrency();
  const getCategoryById = (id: string) => categories.find((c) => c.id === id);
  const getSpentForCategory = (id: string) =>
    spendingByCategory.find((s) => s.categoryId === id)?.amount ?? 0;

  if (!budget || budget.allocations.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Budget Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-6 text-center text-sm">
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
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Budget Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topAllocations.map((allocation) => (
          <AllocationItem
            key={allocation.categoryId}
            allocation={allocation}
            category={getCategoryById(allocation.categoryId)}
            formatCurrency={formatCurrency}
            symbol={symbol}
          />
        ))}
      </CardContent>
    </Card>
  );
}
