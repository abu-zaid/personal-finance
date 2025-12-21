'use client';

import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { format } from 'date-fns';

interface DailySpendingAnalysisProps {
    data: { label: string; value: number }[];
    formatCurrency: (value: number) => string;
}

export function DailySpendingAnalysis({ data, formatCurrency }: DailySpendingAnalysisProps) {
    const dynamicHeight = Math.max(400, data.length * 40 + 50);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Daily Spending</CardTitle>
                <CardDescription>Breakdown for {format(new Date(), 'MMMM')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="min-w-0 w-full overflow-x-auto">
                    <div style={{ height: `${dynamicHeight}px`, minWidth: '600px' }}>
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
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                                <XAxis
                                    type="number"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => formatCurrency(value)}
                                    className="text-xs"
                                />
                                <YAxis
                                    type="category"
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    className="text-xs"
                                    width={30}
                                />
                                <ChartTooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <div className="grid gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                            Day {payload[0].payload.label}
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
                                    radius={[0, 4, 4, 0]}
                                />
                            </BarChart>
                        </ChartContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
