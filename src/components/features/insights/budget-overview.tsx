'use client';

import { PiggyBank } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface BudgetOverviewProps {
    currentBudget: any; // Using any for simplicity as I don't have the full type here, but usually it's Budget
    budgetUsage: number;
    budgetRemaining: number;
    currentMonthTotal: number;
    formatCurrency: (value: number) => string;
}

export function BudgetOverview({
    currentBudget,
    budgetUsage,
    budgetRemaining,
    currentMonthTotal,
    formatCurrency,
}: BudgetOverviewProps) {
    if (!currentBudget) return null;

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <PiggyBank className="h-4 w-4" />
                        Budget Status
                    </CardTitle>
                    <span className={cn(
                        "text-sm font-medium",
                        budgetUsage >= 100 ? "text-destructive" : budgetUsage >= 80 ? "text-yellow-500" : "text-primary"
                    )}>
                        {budgetUsage.toFixed(0)}% used
                    </span>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <Progress
                    value={Math.min(budgetUsage, 100)}
                    className={cn("h-3", {
                        "[&>div]:bg-primary": budgetUsage < 80,
                        "[&>div]:bg-yellow-500": budgetUsage >= 80 && budgetUsage < 100,
                        "[&>div]:bg-destructive": budgetUsage >= 100,
                    })}
                />
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                        {formatCurrency(currentMonthTotal)} of {formatCurrency(currentBudget.totalAmount)}
                    </span>
                    <span className={cn(
                        "font-medium",
                        budgetRemaining >= 0 ? "text-primary" : "text-destructive"
                    )}>
                        {budgetRemaining >= 0
                            ? `${formatCurrency(budgetRemaining)} left`
                            : `${formatCurrency(Math.abs(budgetRemaining))} over`
                        }
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
