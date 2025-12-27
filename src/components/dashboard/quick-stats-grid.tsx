'use client';

import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Grid, Stack, Group, Box } from '@/components/ui/layout';
import { AnimatedNumber } from '@/components/animations';
import { cn } from '@/lib/utils';

interface QuickStatsGridProps {
    monthlyIncome: number;
    monthlyExpense: number;
    netSavings: number;
    budgetStatus?: {
        utilized: number;
        total: number;
        percentage: number;
    };
    symbol: string;
    trends?: {
        income: number;
        expense: number;
        savings: number;
    };
}

export function QuickStatsGrid({
    monthlyIncome,
    monthlyExpense,
    netSavings,
    budgetStatus,
    symbol,
    trends
}: QuickStatsGridProps) {
    const savingsPositive = netSavings >= 0;

    return (
        <Grid cols={2} gap={3} className="md:grid-cols-4">
            {/* Income */}
            <Card className="border-border/40">
                <CardContent className="p-4">
                    <Stack gap={3}>
                        <Group justify="between" align="start">
                            <Box className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </Box>
                            {trends?.income !== undefined && (
                                <Box className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium",
                                    trends.income >= 0
                                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                                )}>
                                    {trends.income >= 0 ? '+' : ''}{trends.income}%
                                </Box>
                            )}
                        </Group>
                        <Stack gap={1}>
                            <p className="text-xs text-muted-foreground font-medium">Income</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                                {symbol}<AnimatedNumber value={monthlyIncome} />
                            </p>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            {/* Expenses */}
            <Card className="border-border/40">
                <CardContent className="p-4">
                    <Stack gap={3}>
                        <Group justify="between" align="start">
                            <Box className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </Box>
                            {trends?.expense !== undefined && (
                                <Box className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium",
                                    trends.expense <= 0
                                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                                )}>
                                    {trends.expense >= 0 ? '+' : ''}{trends.expense}%
                                </Box>
                            )}
                        </Group>
                        <Stack gap={1}>
                            <p className="text-xs text-muted-foreground font-medium">Expenses</p>
                            <p className="text-xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                                {symbol}<AnimatedNumber value={monthlyExpense} />
                            </p>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            {/* Net Savings */}
            <Card className="border-border/40">
                <CardContent className="p-4">
                    <Stack gap={3}>
                        <Group justify="between" align="start">
                            <Box className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center",
                                savingsPositive
                                    ? "bg-primary/10"
                                    : "bg-orange-500/10"
                            )}>
                                <Wallet className={cn(
                                    "h-5 w-5",
                                    savingsPositive
                                        ? "text-primary"
                                        : "text-orange-600 dark:text-orange-400"
                                )} />
                            </Box>
                            {trends?.savings !== undefined && (
                                <Box className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium",
                                    trends.savings >= 0
                                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                                )}>
                                    {trends.savings >= 0 ? '+' : ''}{trends.savings}%
                                </Box>
                            )}
                        </Group>
                        <Stack gap={1}>
                            <p className="text-xs text-muted-foreground font-medium">Net Savings</p>
                            <p className={cn(
                                "text-xl font-bold tabular-nums",
                                savingsPositive
                                    ? "text-primary"
                                    : "text-orange-600 dark:text-orange-400"
                            )}>
                                {savingsPositive ? '+' : '-'}{symbol}<AnimatedNumber value={Math.abs(netSavings)} />
                            </p>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            {/* Budget Status */}
            <Card className="border-border/40">
                <CardContent className="p-4">
                    <Stack gap={3}>
                        <Group justify="between" align="start">
                            <Box className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center",
                                budgetStatus
                                    ? budgetStatus.percentage >= 100
                                        ? "bg-red-500/10"
                                        : budgetStatus.percentage >= 80
                                            ? "bg-yellow-500/10"
                                            : "bg-green-500/10"
                                    : "bg-muted"
                            )}>
                                <Target className={cn(
                                    "h-5 w-5",
                                    budgetStatus
                                        ? budgetStatus.percentage >= 100
                                            ? "text-red-600 dark:text-red-400"
                                            : budgetStatus.percentage >= 80
                                                ? "text-yellow-600 dark:text-yellow-400"
                                                : "text-green-600 dark:text-green-400"
                                        : "text-muted-foreground"
                                )} />
                            </Box>
                            {budgetStatus && (
                                <Box className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium",
                                    budgetStatus.percentage >= 100
                                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                        : budgetStatus.percentage >= 80
                                            ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                                            : "bg-green-500/10 text-green-600 dark:text-green-400"
                                )}>
                                    {budgetStatus.percentage.toFixed(0)}%
                                </Box>
                            )}
                        </Group>
                        <Stack gap={1}>
                            <p className="text-xs text-muted-foreground font-medium">Budget</p>
                            {budgetStatus ? (
                                <p className={cn(
                                    "text-xl font-bold tabular-nums",
                                    budgetStatus.percentage >= 100
                                        ? "text-red-600 dark:text-red-400"
                                        : budgetStatus.percentage >= 80
                                            ? "text-yellow-600 dark:text-yellow-400"
                                            : "text-green-600 dark:text-green-400"
                                )}>
                                    {symbol}<AnimatedNumber value={budgetStatus.total - budgetStatus.utilized} />
                                </p>
                            ) : (
                                <p className="text-xl font-bold text-muted-foreground">
                                    Not Set
                                </p>
                            )}
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Grid>
    );
}
