'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { CategoryIcon } from '@/components/features/categories';
import { Badge } from '@/components/ui/badge'; // Optional, if needed

interface BudgetCategoryItemProps {
    item: any; // Type strictly if possible
    formatCurrency: (val: number) => string;
}

export const BudgetCategoryItem = React.memo(function BudgetCategoryItem({ item, formatCurrency }: BudgetCategoryItemProps) {
    return (
        <div className="bg-white dark:bg-card p-4 rounded-3xl border shadow-sm">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {item.category && (
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full opacity-20" style={{ backgroundColor: item.category.color }} />
                            <CategoryIcon icon={item.category.icon} color={item.category.color} size="md" className="relative z-10" />
                        </div>
                    )}
                    <div>
                        <h4 className="font-semibold text-sm">{item.category?.name}</h4>
                        <p className="text-xs text-muted-foreground">
                            {item.percentage >= 100
                                ? <span className="text-destructive font-medium">Over by {formatCurrency(Math.abs(item.remaining))}</span>
                                : <span>{formatCurrency(item.remaining)} left</span>
                            }
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={cn("font-bold text-sm", item.percentage >= 100 && "text-destructive")}>
                        {formatCurrency(item.spent)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        of {formatCurrency(item.amount)}
                    </p>
                </div>
            </div>
            <Progress
                value={Math.min(item.percentage, 100)}
                className={cn("h-2 rounded-full", {
                    "[&>div]:bg-primary": item.percentage < 80,
                    "[&>div]:bg-yellow-500": item.percentage >= 80 && item.percentage < 100,
                    "[&>div]:bg-destructive": item.percentage >= 100,
                })}
            />
        </div>
    );
});
