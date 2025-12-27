'use client';

import { Search } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

import { Button } from '@/components/ui/button';
import { TransactionSkeleton } from '@/components/skeletons/skeleton-loaders';
import { useCurrency } from '@/hooks/use-currency';
import { TransactionWithCategory } from '@/types';
import { Box, Stack, Group } from '@/components/ui/layout';

import { TransactionItem } from './transaction-item';
import { useEffect, useRef } from 'react';

interface TransactionListProps {
    groupedTransactions: Record<string, TransactionWithCategory[]>;
    isLoading: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    onClearFilters: () => void;
    // Item props
    selectedIds: Set<string>;
    isBatchMode: boolean;
    onToggleSelection: (id: string) => void;
    onEdit: (transaction: TransactionWithCategory) => void;
    onDelete?: (id: string) => void;
}

export function TransactionList({
    groupedTransactions,
    isLoading,
    hasMore,
    onLoadMore,
    onClearFilters,
    selectedIds,
    isBatchMode,
    onToggleSelection,
    onEdit,
    onDelete
}: TransactionListProps) {
    const { formatCurrency } = useCurrency();
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const target = entries[0];
            if (target.isIntersecting && !isLoading && hasMore) {
                onLoadMore();
            }
        }, { rootMargin: '100px' });

        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [isLoading, hasMore, onLoadMore]);

    const getDateLabel = (dateStr: string) => {
        const dateFn = new Date(dateStr);
        if (isToday(dateFn)) return 'Today';
        if (isYesterday(dateFn)) return 'Yesterday';
        return format(dateFn, 'EEEE, MMM d');
    };

    const hasData = Object.keys(groupedTransactions).length > 0;

    if (!hasData && !isLoading) {
        return (
            <Stack align="center" justify="center" className="py-20 text-center">
                <Box className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                </Box>
                <h3 className="text-lg font-semibold">No transactions found</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
                    Try adjusting your filters or search query to find what you&apos;re looking for.
                </p>
                <Button variant="link" onClick={onClearFilters} className="mt-4">
                    Clear all filters
                </Button>
            </Stack>
        );
    }

    return (
        <Box className="px-4 md:px-6 pb-6 max-w-full">
            {/* Loading Skeletons (Initial Only) */}
            {isLoading && !hasData && (
                <Stack gap={4}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <TransactionSkeleton key={i} />
                    ))}
                </Stack>
            )}

            {hasData && (
                <Stack gap={6} className="mt-4">
                    {Object.entries(groupedTransactions).map(([date, list]) => (
                        <Box key={date}>
                            {/* Date Header */}
                            <Group
                                className="sticky top-0 z-10 py-2 bg-background/95 backdrop-blur-sm border-b border-border/40 mb-3"
                                justify="between"
                                align="center"
                            >
                                <h3 className="text-sm font-semibold text-primary">
                                    {getDateLabel(date)}
                                </h3>
                                <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                    {formatCurrency(list.reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0))}
                                </span>
                            </Group>

                            {/* Transactions */}
                            <Stack gap={2}>
                                {list.map((transaction) => (
                                    <TransactionItem
                                        key={transaction.id}
                                        transaction={transaction}
                                        isSelected={selectedIds.has(transaction.id)}
                                        isBatchMode={isBatchMode}
                                        formatCurrency={formatCurrency}
                                        onToggleSelection={onToggleSelection}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    ))}
                </Stack>
            )}

            {/* Load More Trigger */}
            <Box ref={loadMoreRef} className="h-20 flex items-center justify-center">
                {isLoading && hasData && (
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
            </Box>
        </Box>
    );
}
