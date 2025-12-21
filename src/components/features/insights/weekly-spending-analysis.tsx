'use client';

import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { format } from 'date-fns';

interface WeeklySpendingAnalysisProps {
    data: { label: string; fullLabel: string; value: number }[];
    formatCurrency: (value: number) => string;
}

export function WeeklySpendingAnalysis({ data, formatCurrency }: WeeklySpendingAnalysisProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Weekly Breakdown</CardTitle>
                <CardDescription>Spending by week for {format(new Date(), 'MMMM')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full min-w-0">
                    <ChartContainer
                        config={{
                            spending: {
                                label: "Amount",
                                color: "hsl(var(--primary))",
                            },
                        }}
                        className="h-full w-full"
                    >
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                className="text-xs"
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                className="text-xs"
                                tickFormatter={(value) => formatCurrency(value)}
                            />
                            <ChartTooltip
                                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="grid gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        {payload[0].payload.fullLabel}
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
                            <Bar
                                dataKey="value"
                                fill="hsl(var(--primary))"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    );
}
