'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stack, Group, Box } from '@/components/ui/layout';
import { CategoryIcon } from '@/components/features/categories';
import { format } from 'date-fns';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    date: string | Date;
    notes?: string;
    category?: {
        id: string;
        name: string;
        icon: string;
        color: string;
    };
}

interface RecentActivityFeedProps {
    transactions: Transaction[];
    symbol: string;
    limit?: number;
}

export function RecentActivityFeed({ transactions, symbol, limit = 5 }: RecentActivityFeedProps) {
    const recentTransactions = transactions.slice(0, limit);

    // Group by date
    const groupedByDate = recentTransactions.reduce((acc, transaction) => {
        const dateStr = format(new Date(transaction.date), 'yyyy-MM-dd');
        if (!acc[dateStr]) {
            acc[dateStr] = [];
        }
        acc[dateStr].push(transaction);
        return acc;
    }, {} as Record<string, Transaction[]>);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
            return 'Today';
        } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
            return 'Yesterday';
        } else {
            return format(date, 'MMM d');
        }
    };

    return (
        <Card>
            <CardHeader>
                <Group justify="between" align="center">
                    <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                        <Link href="/transactions">
                            View All
                            <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                    </Button>
                </Group>
            </CardHeader>
            <CardContent>
                <Stack gap={4}>
                    {Object.keys(groupedByDate).length > 0 ? (
                        Object.entries(groupedByDate).map(([dateStr, txns]) => (
                            <Stack key={dateStr} gap={2}>
                                {/* Date Header */}
                                <Group justify="between" align="center" className="px-1">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {formatDate(dateStr)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {symbol}{txns.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0).toFixed(0)}
                                    </p>
                                </Group>

                                {/* Transactions */}
                                <Stack gap={2}>
                                    {txns.map((transaction) => (
                                        <Group
                                            key={transaction.id}
                                            justify="between"
                                            align="center"
                                            className="p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                                        >
                                            <Group align="center" gap={3}>
                                                {transaction.category ? (
                                                    <Box className="relative">
                                                        <Box
                                                            className="absolute inset-0 rounded-full opacity-20"
                                                            style={{ backgroundColor: transaction.category.color }}
                                                        />
                                                        <CategoryIcon
                                                            icon={transaction.category.icon}
                                                            color={transaction.category.color}
                                                            size="sm"
                                                            className="relative z-10"
                                                        />
                                                    </Box>
                                                ) : (
                                                    <Box className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                        {transaction.type === 'income' ? (
                                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <TrendingDown className="h-4 w-4 text-red-500" />
                                                        )}
                                                    </Box>
                                                )}
                                                <Stack gap={0}>
                                                    <p className="text-sm font-medium">
                                                        {transaction.category?.name || (transaction.type === 'income' ? 'Income' : 'Expense')}
                                                    </p>
                                                    {transaction.notes && (
                                                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                                                            {transaction.notes}
                                                        </p>
                                                    )}
                                                </Stack>
                                            </Group>
                                            <p className={cn(
                                                "text-sm font-semibold tabular-nums",
                                                transaction.type === 'income'
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-foreground"
                                            )}>
                                                {transaction.type === 'income' && '+'}{symbol}{transaction.amount.toFixed(0)}
                                            </p>
                                        </Group>
                                    ))}
                                </Stack>
                            </Stack>
                        ))
                    ) : (
                        <Box className="py-8 text-center">
                            <p className="text-sm text-muted-foreground">No recent activity</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Start adding transactions to see them here
                            </p>
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
