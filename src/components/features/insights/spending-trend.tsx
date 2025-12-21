'use client';

import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';

interface SpendingTrendProps {
    data: { label: string; value: number }[];
    formatCurrency: (value: number) => string;
}

export function SpendingTrend({ data, formatCurrency }: SpendingTrendProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Spending Trend</CardTitle>
                <CardDescription>Your spending over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="min-w-0 w-full">
                    <ChartContainer
                        config={{
                            spending: {
                                label: "Spending",
                                color: "hsl(var(--primary))",
                            },
                        }}
                        className="h-[300px] w-full"
                    >
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="fillSpending" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                className="text-xs"
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                className="text-xs"
                                tickFormatter={(value) => formatCurrency(value)}
                            />
                            <ChartTooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="grid gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        {payload[0].payload.label}
                                                    </span>
                                                    <span className="font-bold text-foreground">
                                                        {formatCurrency(payload[0].value as number)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="hsl(var(--primary))"
                                fill="url(#fillSpending)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    );
}
