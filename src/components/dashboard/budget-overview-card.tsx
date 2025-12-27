'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stack, Group, Box } from '@/components/ui/layout';
import { Progress } from '@/components/ui/progress';
import { AnimatedNumber } from '@/components/animations';
import { Target, TrendingDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface BudgetOverviewCardProps {
    budgetData?: {
        total: number;
        spent: number;
        remaining: number;
        percentage: number;
        dailyAllowance: number;
        topCategories: Array<{
            name: string;
            spent: number;
            budget: number;
            percentage: number;
        }>;
    };
    symbol: string;
}

export function BudgetOverviewCard({ budgetData, symbol }: BudgetOverviewCardProps) {
    if (!budgetData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Budget</CardTitle>
                </CardHeader>
                <CardContent>
                    <Stack gap={4} className="py-8 text-center">
                        <Box className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                            <Target className="h-8 w-8 text-muted-foreground" />
                        </Box>
                        <Stack gap={2}>
                            <p className="text-sm font-medium">No Budget Set</p>
                            <p className="text-xs text-muted-foreground">
                                Create a budget to track your spending
                            </p>
                        </Stack>
                        <Button asChild size="sm" className="mx-auto">
                            <Link href="/budgets">Create Budget</Link>
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        );
    }

    const { total, spent, remaining, percentage, dailyAllowance, topCategories } = budgetData;
    const isOverBudget = percentage >= 100;
    const isWarning = percentage >= 80 && percentage < 100;

    return (
        <Card>
            <CardHeader>
                <Group justify="between" align="center">
                    <CardTitle className="text-lg font-semibold">Budget Overview</CardTitle>
                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                        <Link href="/budgets">Details</Link>
                    </Button>
                </Group>
            </CardHeader>
            <CardContent>
                <Stack gap={5}>
                    {/* Circular Progress */}
                    <Box className="relative mx-auto">
                        <svg className="w-32 h-32 transform -rotate-90">
                            {/* Background circle */}
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-muted/20"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 56}`}
                                strokeDashoffset={`${2 * Math.PI * 56 * (1 - Math.min(percentage, 100) / 100)}`}
                                className={cn(
                                    "transition-all duration-500",
                                    isOverBudget
                                        ? "text-red-500"
                                        : isWarning
                                            ? "text-yellow-500"
                                            : "text-green-500"
                                )}
                                strokeLinecap="round"
                            />
                        </svg>
                        {/* Center text */}
                        <Box className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className={cn(
                                "text-2xl font-bold tabular-nums",
                                isOverBudget
                                    ? "text-red-500"
                                    : isWarning
                                        ? "text-yellow-500"
                                        : "text-green-500"
                            )}>
                                {percentage.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">Used</p>
                        </Box>
                    </Box>

                    {/* Budget Stats */}
                    <Stack gap={3}>
                        <Group justify="between" className="pb-2 border-b border-border/50">
                            <span className="text-sm text-muted-foreground">Remaining</span>
                            <p className={cn(
                                "text-lg font-bold tabular-nums",
                                remaining < 0 ? "text-red-500" : "text-foreground"
                            )}>
                                {remaining < 0 && '-'}{symbol}<AnimatedNumber value={Math.abs(remaining)} />
                            </p>
                        </Group>

                        <Group justify="between">
                            <span className="text-sm text-muted-foreground">Daily Allowance</span>
                            <p className={cn(
                                "text-sm font-semibold tabular-nums",
                                dailyAllowance < 0 ? "text-red-500" : "text-green-600 dark:text-green-400"
                            )}>
                                {dailyAllowance < 0 && '-'}{symbol}<AnimatedNumber value={Math.abs(dailyAllowance)} />
                            </p>
                        </Group>
                    </Stack>

                    {/* At-Risk Categories */}
                    {topCategories.length > 0 && (
                        <Stack gap={2}>
                            <Group align="center" gap={2}>
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                                <p className="text-xs font-medium text-muted-foreground">Categories at Risk</p>
                            </Group>
                            <Stack gap={2}>
                                {topCategories.map((cat, idx) => (
                                    <Group key={idx} justify="between" align="center">
                                        <span className="text-xs text-muted-foreground truncate">{cat.name}</span>
                                        <span className={cn(
                                            "text-xs font-semibold",
                                            cat.percentage >= 100
                                                ? "text-red-500"
                                                : "text-orange-500"
                                        )}>
                                            {cat.percentage.toFixed(0)}%
                                        </span>
                                    </Group>
                                ))}
                            </Stack>
                        </Stack>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
