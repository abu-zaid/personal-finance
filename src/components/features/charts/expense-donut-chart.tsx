'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useCurrency } from '@/hooks/use-currency';

interface ExpenseDonutChartProps {
    data: {
        name: string;
        value: number;
        color: string;
    }[];
    totalAmount: number;
}

export function ExpenseDonutChart({ data, totalAmount }: ExpenseDonutChartProps) {
    const { symbol } = useCurrency();

    const chartConfig = useMemo(() => {
        const config: Record<string, { label: string; color: string }> = {};
        data.forEach((item) => {
            config[item.name] = {
                label: item.name,
                color: item.color,
            };
        });
        return config;
    }, [data]);

    return (
        <div className="w-full flex flex-col items-center">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel indicator="line" className="w-40" />}
                        />
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={75}
                            outerRadius={100}
                            paddingAngle={5}
                            cornerRadius={8}
                            stroke="none"
                            isAnimationActive={true}
                            animationDuration={1500}
                            animationBegin={200}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="central"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) - 10}
                                                    className="fill-muted-foreground text-[10px] font-bold uppercase tracking-widest"
                                                >
                                                    SPENT
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 14}
                                                    className="fill-foreground text-2xl font-bold"
                                                >
                                                    {symbol}{Math.round(totalAmount).toLocaleString()}
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </ChartContainer>

            <div className="grid grid-cols-2 gap-3 w-full mt-4 max-w-sm">
                {data.map((item, index) => {
                    const percentage = totalAmount > 0 ? (item.value / totalAmount) * 100 : 0;
                    return (
                        <div key={index} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                <span className="text-xs font-medium truncate max-w-[80px]">{item.name}</span>
                            </div>
                            <span className="text-xs font-bold text-muted-foreground">{percentage.toFixed(0)}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
