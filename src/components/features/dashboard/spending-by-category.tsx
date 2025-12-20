'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryIcon } from '@/components/features/categories/category-icon';
import { useCurrency } from '@/hooks/use-currency';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

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
  const { formatCurrency } = useCurrency();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const getCategoryById = (id: string) => categories.find((c) => c.id === id);

  // Sort by amount (highest first)
  const sortedSpending = [...spending].sort((a, b) => b.amount - a.amount);

  // Take top 6 categories
  const topSpending = sortedSpending.slice(0, 6);

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {topSpending.length > 0 ? (
          <div className="space-y-4">
            {topSpending.map((item, index) => {
              const category = getCategoryById(item.categoryId);
              const percentage = totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;
              const isHovered = hoveredIndex === index;

              return (
                <motion.div
                  key={item.categoryId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                  className={cn(
                    "space-y-2.5 rounded-lg p-2 -mx-2 transition-all cursor-pointer",
                    isHovered && "bg-muted/30"
                  )}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <motion.div
                        className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 transition-all"
                        style={{
                          background: category?.color ? `${category.color}15` : 'var(--muted)',
                        }}
                        animate={{
                          scale: isHovered ? 1.1 : 1,
                          boxShadow: isHovered && category?.color
                            ? `0 0 12px ${category.color}40`
                            : 'none',
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {category && (
                          <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                        )}
                      </motion.div>
                      <span className={cn(
                        "text-sm font-medium transition-colors truncate",
                        isHovered && "text-foreground font-semibold"
                      )}>
                        {category?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-right flex items-baseline gap-1.5">
                      <motion.span
                        className="text-sm font-semibold"
                        animate={{ scale: isHovered ? 1.05 : 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {formatCurrency(item.amount)}
                      </motion.span>
                      <span className="text-muted-foreground/60 text-[10px] font-medium">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.05]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${percentage}%`,
                        filter: isHovered && category?.color
                          ? `drop-shadow(0 0 4px ${category.color}80)`
                          : 'none',
                      }}
                      transition={{
                        width: { duration: 0.6, delay: 0.1 + index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] },
                        filter: { duration: 0.2 }
                      }}
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background: category?.color
                          ? `linear-gradient(90deg, ${category.color}80, ${category.color})`
                          : 'hsl(var(--primary))',
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-muted-foreground/70 py-8 text-center text-sm">
            No spending data yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
