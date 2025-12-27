'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stack, Group, Box } from '@/components/ui/layout';
import { format, subDays, startOfDay } from 'date-fns';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface DailyData {
    date: string;
    amount: number;
    count: number;
}

interface SpendingChartProps {
    dailyData: DailyData[];
    symbol: string;
    days?: number;
}

export function SpendingChart({ dailyData, symbol, days = 7 }: SpendingChartProps) {
    // Calculate average and max for scaling
    const { maxAmount, avgAmount, chartData } = useMemo(() => {
        // Fill in missing days with 0
        const filled: DailyData[] = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = format(startOfDay(subDays(new Date(), i)), 'yyyy-MM-dd');
            const existing = dailyData.find(d => d.date === date);
            filled.push(existing || { date, amount: 0, count: 0 });
        }

        // Calculate average only from days with spending
        const amounts = filled.map(d => d.amount).filter(a => a > 0);
        const total = filled.reduce((sum, d) => sum + d.amount, 0);
        const avg = amounts.length > 0 ? total / amounts.length : 0;
        const max = amounts.length > 0 ? Math.max(...amounts) : 100;

        return {
            maxAmount: max,
            avgAmount: avg,
            chartData: filled
        };
    }, [dailyData, days]);

    const barWidth = 100 / days;

    return (
        <Card>
            <CardHeader>
                <Group justify="between" align="center">
                    <Stack gap={1}>
                        <CardTitle className="text-lg font-semibold">Daily Spending</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Last {days} days • Avg: {symbol}{avgAmount.toFixed(0)}/day
                        </p>
                    </Stack>
                </Group>
            </CardHeader>
            <CardContent>
                <Stack gap={4}>
                    {/* Chart */}
                    <div className="relative h-48 w-full bg-muted/5 rounded-lg overflow-hidden pb-6">
                        {/* Average line */}
                        {avgAmount > 0 && (
                            <div
                                className="absolute left-0 right-0 border-t-2 border-dashed border-primary/40 z-10"
                                style={{ bottom: `${(avgAmount / maxAmount) * 100}%` }}
                            >
                                <span className="absolute top-0 right-2 -translate-y-full text-[10px] text-muted-foreground bg-background px-1">
                                    Avg: {symbol}{avgAmount.toFixed(0)}
                                </span>
                            </div>
                        )}


                        {/* Bars */}
                        {chartData.map((day, index) => {
                            const heightPercent = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
                            const isToday = day.date === format(new Date(), 'yyyy-MM-dd');
                            const isAboveAvg = day.amount > avgAmount;

                            return (
                                <div
                                    key={day.date}
                                    className="group absolute bottom-0 transition-all"
                                    style={{
                                        left: `${index * barWidth}%`,
                                        width: `${barWidth}%`,
                                        height: '100%',
                                    }}
                                >
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap">
                                        <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-xl border text-xs">
                                            <p className="font-bold text-sm">{format(new Date(day.date), 'EEE, MMM d')}</p>
                                            <div className="mt-1 space-y-0.5">
                                                <p className="text-muted-foreground">
                                                    <span className="font-semibold text-foreground">{symbol}{day.amount.toFixed(0)}</span> spent
                                                </p>
                                                <p className="text-muted-foreground">
                                                    {day.count} transaction{day.count !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bar */}
                                    <div
                                        className={cn(
                                            "absolute bottom-0 left-0 right-0 mx-auto rounded-t-md transition-all duration-200 cursor-pointer",
                                            "hover:scale-105 hover:shadow-lg",
                                            isToday
                                                ? "bg-primary hover:bg-primary/90 shadow-primary/20"
                                                : isAboveAvg && day.amount > 0
                                                    ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                                                    : day.amount > 0
                                                        ? "bg-green-500 hover:bg-green-600 shadow-green-500/20"
                                                        : "bg-border hover:bg-border/80"
                                        )}
                                        style={{
                                            height: day.amount > 0 ? `${Math.max(heightPercent, 8)}%` : '3px',
                                            width: '85%',
                                        }}
                                    />

                                    {/* Day label */}
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                        {format(new Date(day.date), 'EEE')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <Group justify="center" gap={4} className="text-xs text-muted-foreground flex-wrap">
                        <Group align="center" gap={1}>
                            <Box className="h-3 w-3 rounded bg-primary" />
                            <span>Today</span>
                        </Group>
                        <Group align="center" gap={1}>
                            <Box className="h-3 w-3 rounded bg-red-500" />
                            <span>Above Average (High Spending)</span>
                        </Group>
                        <Group align="center" gap={1}>
                            <Box className="h-3 w-3 rounded bg-green-500" />
                            <span>Below Average (Good!)</span>
                        </Group>
                    </Group>
                </Stack>
            </CardContent>
        </Card>
    );
}
