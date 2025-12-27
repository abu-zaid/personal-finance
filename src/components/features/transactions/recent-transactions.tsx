'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { useGetTransactionsQuery, useGetCategoriesQuery } from '@/lib/features/api/apiSlice';
import { useCurrency } from '@/hooks/use-currency';
import { DollarSign } from 'lucide-react';
import { CategoryIcon } from '@/components/features/categories/category-icon';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Box, Stack, Group } from '@/components/ui/layout';

export function RecentTransactions() {
    const { data: transactions = [] } = useGetTransactionsQuery();
    const { data: categories = [] } = useGetCategoriesQuery();
    const { formatCurrency } = useCurrency();

    const recentTransactions = useMemo(() => {
        return transactions.slice(0, 5);
    }, [transactions]);

    return (
        <Stack gap={4}>
            <Group justify="between" className="px-1">
                <h3 className="font-bold text-lg">Recent Transactions</h3>
                <Link href="/transactions" passHref legacyBehavior>
                    <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-medium text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                        <a>See All</a>
                    </Button>
                </Link>
            </Group>

            <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-card">
                <CardContent className="p-4">
                    <Stack gap={1}>
                        {recentTransactions.length === 0 ? (
                            <Box className="py-8 text-center text-muted-foreground text-sm">
                                No recent transactions found
                            </Box>
                        ) : (
                            recentTransactions.map((transaction) => {
                                const category = categories.find(c => c.id === transaction.category_id); // Fixed categoryId -> category_id
                                return (
                                    <Group
                                        key={transaction.id}
                                        justify="between"
                                        className="p-3 rounded-2xl hover:bg-muted/30 transition-colors"
                                    >
                                        <Group gap={3}>
                                            <Box
                                                className="h-10 w-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground"
                                                style={category?.color ? {
                                                    backgroundColor: `${category.color}20`,
                                                    color: category.color
                                                } : undefined}
                                            >
                                                {category ? (
                                                    <CategoryIcon icon={category.icon} color={category.color} className="h-5 w-5" />
                                                ) : (
                                                    <DollarSign className="h-5 w-5 opacity-70" />
                                                )}
                                            </Box>
                                            <Stack gap={0} className="space-y-0.5">
                                                {/* gap={0} but space-y-0.5 utility is 2px. Stack gap is usually 4px steps. 
                                                     I'll use gap={0} and strict className or gap={1} which is 4px. 
                                                     Existing was space-y-0.5 (2px). 
                                                     Let's use custom className for precision or gap={0.5} support in Stack if I added it... I didn't.
                                                     I'll stick to className for micro-spacing or just generic gap={1}.
                                                 */}
                                                <p className="font-semibold text-sm line-clamp-1">{category?.name || 'Uncategorized'}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(transaction.date), 'MMM d')}</p>
                                            </Stack>
                                        </Group>
                                        <span className={cn(
                                            "font-bold text-sm tabular-nums", // Added tabular-nums per Design Doc
                                            transaction.type === 'expense' ? "text-foreground" : "text-emerald-500"
                                        )}>
                                            {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                                        </span>
                                    </Group>
                                );
                            })
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}
