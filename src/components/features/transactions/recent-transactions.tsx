'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { useAppSelector } from '@/lib/hooks';
import { selectTransactions } from '@/lib/features/transactions/transactionsSlice';
import { selectCategories } from '@/lib/features/categories/categoriesSlice';
import { useCurrency } from '@/hooks/use-currency';
import { ShoppingBag, Coffee, Home, Car, Zap, DollarSign } from 'lucide-react';
import { CategoryIcon } from '@/components/features/categories/category-icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function RecentTransactions() {
    const transactions = useAppSelector(selectTransactions);
    const categories = useAppSelector(selectCategories);
    const { symbol, formatCurrency } = useCurrency();

    const recentTransactions = useMemo(() => {
        return transactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [transactions]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-lg">Recent Transactions</h3>
                <Link href="/transactions">
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                        See All
                    </Button>
                </Link>
            </div>

            <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-card">
                <CardContent className="p-4 space-y-1">
                    {recentTransactions.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                            No recent transactions found
                        </div>
                    ) : (
                        recentTransactions.map((transaction, index) => {
                            const category = categories.find(c => c.id === transaction.categoryId);
                            return (
                                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div
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
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="font-semibold text-sm line-clamp-1">{category?.name || 'Uncategorized'}</p>
                                            <p className="text-xs text-muted-foreground">{format(new Date(transaction.date), 'MMM d')}</p>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "font-bold text-sm",
                                        transaction.type === 'expense' ? "text-foreground" : "text-emerald-500"
                                    )}>
                                        {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
