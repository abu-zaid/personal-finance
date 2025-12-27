'use client';

import { TrendingUp, TrendingDown, DollarSign, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedNumber } from '@/components/animations';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';
import { Box, Stack, Group, Grid } from '@/components/ui/layout';

interface TransactionsHeaderProps {
    isLoading: boolean;
    stats: {
        income: number;
        expense: number;
        net: number;
    };
    onAddTransaction: () => void;
}

export function TransactionsHeader({ isLoading, stats, onAddTransaction }: TransactionsHeaderProps) {
    const { symbol } = useCurrency();

    if (isLoading) {
        return (
            <Stack gap={4} className="px-4 md:px-6 py-4">
                <Group justify="between" align="center" gap={4}>
                    <Box className="min-w-0 flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">Transactions</h1>
                    </Box>
                    <Group align="center" gap={2}>
                        <Button variant="outline" size="sm" className="hidden md:flex h-9 rounded-full border-border/60" disabled>
                            <p className="mr-2">Export</p>
                        </Button>
                        <Button size="sm" className="h-9 w-9 p-0 rounded-full" disabled>
                            <Plus className="h-5 w-5" />
                        </Button>
                    </Group>
                </Group>

                <Grid cols={3} gap={2} className="md:gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="shadow-none border-border/40 bg-card/50">
                            <CardContent className="p-4 space-y-2">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-7 w-24" />
                            </CardContent>
                        </Card>
                    ))}
                </Grid>
            </Stack>
        );
    }

    return (
        <Stack gap={4} className="px-4 md:px-6 py-4">
            <Group justify="between" align="center" gap={4}>
                <Box className="min-w-0 flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">Transactions</h1>
                </Box>
                <Group align="center" gap={2}>
                    <Button variant="outline" size="sm" className="hidden md:flex h-9 rounded-full border-border/60">
                        <p className="mr-2">Export</p>
                    </Button>
                    <Button
                        size="sm"
                        className="h-9 w-9 p-0 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={onAddTransaction}
                    >
                        <Plus className="h-5 w-5" strokeWidth={3} />
                    </Button>
                </Group>
            </Group>

            <Grid cols={3} gap={2} className="md:gap-4 max-w-full min-w-0">
                <Card className="border-border/40 min-w-0">
                    <CardContent className="p-3 md:p-4">
                        <Group align="center" gap={2} className="mb-1">
                            <Box className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </Box>
                            <span className="text-[10px] md:text-xs text-muted-foreground font-medium truncate">Income</span>
                        </Group>
                        <p className="text-sm md:text-xl font-bold text-green-500 tabular-nums truncate">
                            {symbol}<AnimatedNumber value={stats.income} />
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border/40 min-w-0">
                    <CardContent className="p-3 md:p-4">
                        <Group align="center" gap={2} className="mb-1">
                            <Box className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            </Box>
                            <span className="text-[10px] md:text-xs text-muted-foreground font-medium truncate">Expense</span>
                        </Group>
                        <p className="text-sm md:text-xl font-bold text-red-500 tabular-nums truncate">
                            {symbol}<AnimatedNumber value={stats.expense} />
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border/40 min-w-0">
                    <CardContent className="p-3 md:p-4">
                        <Group align="center" gap={2} className="mb-1">
                            <Box className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <DollarSign className="h-4 w-4 text-primary" />
                            </Box>
                            <span className="text-[10px] md:text-xs text-muted-foreground font-medium truncate">Net</span>
                        </Group>
                        <p className={cn(
                            "text-sm md:text-xl font-bold tabular-nums truncate",
                            stats.net >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                            {stats.net >= 0 ? '+' : ''}{symbol}<AnimatedNumber value={Math.abs(stats.net)} />
                        </p>
                    </CardContent>
                </Card>
            </Grid>
        </Stack>
    );
}
