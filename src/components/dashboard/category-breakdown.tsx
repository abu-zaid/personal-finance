'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stack, Group, Box } from '@/components/ui/layout';
import { Progress } from '@/components/ui/progress';
import { CategoryIcon } from '@/components/features/categories';
import { AnimatedNumber } from '@/components/animations';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface CategoryData {
    id: string;
    name: string;
    icon: string;
    color: string;
    amount: number;
    percentage: number;
}

interface CategoryBreakdownProps {
    categories: CategoryData[];
    totalExpense: number;
    symbol: string;
}

export function CategoryBreakdown({ categories, totalExpense, symbol }: CategoryBreakdownProps) {
    // Show top 5 categories
    const topCategories = categories.slice(0, 5);

    return (
        <Card>
            <CardHeader>
                <Group justify="between" align="center">
                    <CardTitle className="text-lg font-semibold">Top Categories</CardTitle>
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
                    {topCategories.length > 0 ? (
                        topCategories.map((category) => (
                            <Stack key={category.id} gap={2}>
                                <Group justify="between" align="center">
                                    <Group align="center" gap={3}>
                                        <Box className="relative">
                                            <Box
                                                className="absolute inset-0 rounded-full opacity-20"
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <CategoryIcon
                                                icon={category.icon}
                                                color={category.color}
                                                size="sm"
                                                className="relative z-10"
                                            />
                                        </Box>
                                        <Stack gap={0}>
                                            <p className="text-sm font-medium">{category.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {category.percentage.toFixed(1)}% of total
                                            </p>
                                        </Stack>
                                    </Group>
                                    <p className="text-sm font-bold tabular-nums">
                                        {symbol}<AnimatedNumber value={category.amount} />
                                    </p>
                                </Group>
                                <Progress
                                    value={category.percentage}
                                    className="h-2"
                                    style={{
                                        // @ts-ignore
                                        '--progress-background': category.color
                                    }}
                                />
                            </Stack>
                        ))
                    ) : (
                        <Box className="py-8 text-center">
                            <p className="text-sm text-muted-foreground">No spending data yet</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Start adding expenses to see your breakdown
                            </p>
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
