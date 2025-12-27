'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { CategoryIcon } from '@/components/features/categories';
import { Stack, Group, Box } from '@/components/ui/layout';

interface BudgetCategoryItemProps {
    item: any; // Type strictly if possible
    formatCurrency: (val: number) => string;
}

export const BudgetCategoryItem = React.memo(function BudgetCategoryItem({ item, formatCurrency }: BudgetCategoryItemProps) {
    return (
        <Stack className="bg-white dark:bg-card p-4 rounded-3xl border shadow-sm" gap={3}>
            <Group justify="between" align="start">
                <Group align="center" gap={3}>
                    {item.category && (
                        <Box className="relative">
                            <Box className="absolute inset-0 rounded-full opacity-20" style={{ backgroundColor: item.category.color }} />
                            <CategoryIcon icon={item.category.icon} color={item.category.color} size="md" className="relative z-10" />
                        </Box>
                    )}
                    <Stack gap={1}>
                        <h4 className="font-semibold text-sm">{item.category?.name}</h4>
                        <p className="text-xs text-muted-foreground">
                            {item.percentage >= 100
                                ? <span className="text-destructive font-medium">Over by {formatCurrency(Math.abs(item.remaining))}</span>
                                : <span>{formatCurrency(item.remaining)} left</span>
                            }
                        </p>
                    </Stack>
                </Group>
                <Stack align="end" gap={1}>
                    <p className={cn("font-bold text-sm", item.percentage >= 100 && "text-destructive")}>
                        {formatCurrency(item.spent)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        of {formatCurrency(item.amount)}
                    </p>
                </Stack>
            </Group>
            <Progress
                value={Math.min(item.percentage, 100)}
                className={cn("h-2 rounded-full", {
                    "[&>div]:bg-primary": item.percentage < 80,
                    "[&>div]:bg-yellow-500": item.percentage >= 80 && item.percentage < 100,
                    "[&>div]:bg-destructive": item.percentage >= 100,
                })}
            />
        </Stack>
    );
});
