'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryIcon } from '@/components/features/categories/category-icon';
import { cn, formatCurrency } from '@/lib/utils';
import { Category } from '@/types';

interface SpendingItem {
  categoryId: string;
  amount: number;
}

interface SpendingByCategoryProps {
  spending: SpendingItem[];
  categories: Category[];
  totalSpent: number;
}

export function SpendingByCategory({
  spending,
  categories,
  totalSpent,
}: SpendingByCategoryProps) {
  const getCategoryById = (id: string) => categories.find((c) => c.id === id);

  // Sort by amount (highest first)
  const sortedSpending = [...spending].sort((a, b) => b.amount - a.amount);

  // Take top 6 categories
  const topSpending = sortedSpending.slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {topSpending.length > 0 ? (
          <div className="space-y-4">
            {topSpending.map((item) => {
              const category = getCategoryById(item.categoryId);
              const percentage = totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;

              return (
                <div key={item.categoryId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {category && (
                        <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                      )}
                      <span className="text-sm font-medium">
                        {category?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: category?.color || 'hsl(var(--primary))',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-muted-foreground py-8 text-center text-sm">
            No spending data yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
