'use client';

import { TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Stack, Group, Box } from '@/components/ui/layout';
import { AnimatedNumber } from '@/components/animations';
import { cn } from '@/lib/utils';

interface HeroBalanceCardProps {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    symbol: string;
    onAddIncome: () => void;
    onAddExpense: () => void;
    trend?: {
        percentage: number;
        isPositive: boolean;
    };
}

export function HeroBalanceCard({
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    symbol,
    onAddIncome,
    onAddExpense,
    trend
}: HeroBalanceCardProps) {
    const isPositive = totalBalance >= 0;

    return (
        <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10">
            <CardContent className="p-6 md:p-8">
                <Stack gap={6}>
                    {/* Balance Section */}
                    <Stack gap={2}>
                        <Group justify="between" align="start">
                            <Stack gap={1}>
                                <p className="text-sm text-muted-foreground font-medium">Total Balance</p>
                                <Group align="center" gap={2}>
                                    <h1 className={cn(
                                        "text-4xl md:text-5xl font-bold tabular-nums",
                                        isPositive ? "text-foreground" : "text-destructive"
                                    )}>
                                        {isPositive ? '' : '-'}{symbol}<AnimatedNumber value={Math.abs(totalBalance)} />
                                    </h1>
                                    {trend && (
                                        <Box className={cn(
                                            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                                            trend.isPositive
                                                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                                        )}>
                                            {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            {Math.abs(trend.percentage)}%
                                        </Box>
                                    )}
                                </Group>
                            </Stack>

                            {/* Quick Actions */}
                            <Group gap={2} className="hidden md:flex">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={onAddIncome}
                                    className="h-9 rounded-full border-green-500/20 text-green-600 hover:bg-green-500/10 hover:text-green-600 dark:text-green-400"
                                >
                                    <ArrowUpRight className="h-4 w-4 mr-1" />
                                    Income
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={onAddExpense}
                                    className="h-9 rounded-full border-red-500/20 text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400"
                                >
                                    <ArrowDownRight className="h-4 w-4 mr-1" />
                                    Expense
                                </Button>
                            </Group>
                        </Group>
                    </Stack>

                    {/* Income vs Expense Comparison */}
                    <Group gap={4} className="pt-4 border-t border-border/50">
                        {/* Income */}
                        <Stack gap={1} className="flex-1">
                            <Group align="center" gap={2}>
                                <Box className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </Box>
                                <span className="text-xs text-muted-foreground font-medium">Income</span>
                            </Group>
                            <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                                {symbol}<AnimatedNumber value={monthlyIncome} />
                            </p>
                        </Stack>

                        {/* Divider */}
                        <Box className="w-px h-12 bg-border/50" />

                        {/* Expense */}
                        <Stack gap={1} className="flex-1">
                            <Group align="center" gap={2}>
                                <Box className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </Box>
                                <span className="text-xs text-muted-foreground font-medium">Expenses</span>
                            </Group>
                            <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                                {symbol}<AnimatedNumber value={monthlyExpense} />
                            </p>
                        </Stack>
                    </Group>

                    {/* Mobile Quick Actions */}
                    <Group gap={2} className="md:hidden">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onAddIncome}
                            className="flex-1 h-10 rounded-full border-green-500/20 text-green-600 hover:bg-green-500/10 hover:text-green-600 dark:text-green-400"
                        >
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            Add Income
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onAddExpense}
                            className="flex-1 h-10 rounded-full border-red-500/20 text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400"
                        >
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                            Add Expense
                        </Button>
                    </Group>
                </Stack>
            </CardContent>
        </Card>
    );
}
