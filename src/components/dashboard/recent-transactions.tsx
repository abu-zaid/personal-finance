'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryIcon } from '@/components/features/categories/category-icon';
import { formatDate } from '@/lib/utils';
import { isToday, isYesterday, format } from 'date-fns';
import { useCurrency } from '@/hooks/use-currency';
import { Transaction, Category } from '@/types';

interface TransactionItemProps {
    transaction: Transaction;
    category: Category | undefined;
    index: number;
    formatCurrency: (amount: number) => string;
}

function TransactionItem({ transaction, category, index, formatCurrency }: TransactionItemProps) {
    const isExpense = transaction.type === 'expense';
    const amountClass = isExpense ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-500';
    const amountPrefix = isExpense ? '-' : '+';

    // Display Logic:
    // If Notes exist: Main = Notes, Sub = Category Name
    // Else: Main = Category Name, Sub = Time
    const mainText = transaction.notes || category?.name || (isExpense ? 'Expense' : 'Income');
    const subText = transaction.notes ? category?.name : format(new Date(transaction.date), 'h:mm a');

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="group relative flex items-center justify-between py-3 px-2 -mx-2 gap-3 rounded-xl transition-all duration-200 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
        >
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                    style={{
                        background: category?.color ? `${category.color}15` : 'var(--muted)',
                    }}
                >
                    {category && (
                        <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate leading-tight">
                        {mainText}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">
                        {subText}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-sm font-semibold ${amountClass}`}>
                    {amountPrefix}{formatCurrency(transaction.amount)}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
            </div>
        </motion.div>
    );
}

interface RecentTransactionsProps {
    transactions: Transaction[];
    categories: Category[];
    limit?: number;
}

export function RecentTransactions({
    transactions,
    categories,
    limit = 5,
}: RecentTransactionsProps) {
    const { formatCurrency } = useCurrency();
    const getCategoryById = (id: string) => categories.find((c) => c.id === id);

    // 1. Sort & Limit
    const sortedTransactions = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);

    // 2. Group by Date
    const grouped = sortedTransactions.reduce((groups, transaction) => {
        const date = new Date(transaction.date);
        let key = 'Earlier';

        if (isToday(date)) key = 'Today';
        else if (isYesterday(date)) key = 'Yesterday';
        else key = format(date, 'EEE, MMM d');

        if (!groups[key]) groups[key] = [];
        groups[key].push(transaction);
        return groups;
    }, {} as Record<string, Transaction[]>);

    return (
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold tracking-tight">Recent Transactions</CardTitle>
                <Link
                    href="/transactions"
                    className="group flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                >
                    View all
                    <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
            </CardHeader>
            <CardContent className="pt-0">
                {sortedTransactions.length > 0 ? (
                    <div className="space-y-4">
                        {Object.entries(grouped).map(([dateLabel, groupTransactions], groupIndex) => (
                            <div key={dateLabel}>
                                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 pl-1">
                                    {dateLabel}
                                </h4>
                                <div className="space-y-0.5">
                                    {groupTransactions.map((transaction, index) => (
                                        <TransactionItem
                                            key={transaction.id}
                                            transaction={transaction}
                                            category={getCategoryById(transaction.categoryId)}
                                            index={groupIndex * 5 + index} // Approx delay stagger
                                            formatCurrency={formatCurrency}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-muted-foreground/70 py-8 text-center text-sm">
                        No transactions yet. Add your first expense!
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
