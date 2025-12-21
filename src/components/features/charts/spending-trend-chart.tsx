'use client';

import { AreaChart, Area, XAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useCurrency } from '@/hooks/use-currency';

interface SpendingTrendChartProps {
    data: {
        date: string;
        amount: number;
    }[];
}

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
    const { symbol } = useCurrency();

    return (
        <div className="h-[250px] w-full">
            <ChartContainer
                config={{
                    amount: { label: "Spending", color: "hsl(var(--primary))" },
                }}
                className="h-full w-full min-w-0 aspect-auto"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="fillAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/0.1)" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={12}
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            interval="preserveStartEnd"
                        />
                        <ChartTooltip
                            cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                            content={
                                <ChartTooltipContent
                                    className="w-[150px]"
                                    nameKey="amount"
                                    labelFormatter={(value) => {
                                        return <span className="text-xs text-muted-foreground font-medium mb-1 block">{value}</span>
                                    }}
                                    indicator="line"
                                />
                            }
                        />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="var(--color-primary)"
                            strokeWidth={3}
                            fill="url(#fillAmount)"
                            activeDot={{
                                r: 6,
                                fill: "var(--color-primary)",
                                stroke: "var(--background)",
                                strokeWidth: 2
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>
    );
}
