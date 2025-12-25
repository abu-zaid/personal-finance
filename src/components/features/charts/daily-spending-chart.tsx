'use client';

import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useCurrency } from '@/hooks/use-currency';

interface DailySpendingChartProps {
    data: {
        date: string;
        amount: number;
        count?: number;
        topCategory?: string;
    }[];
    onBarClick?: (date: string) => void;
    selectedDate?: string | null;
}

export function DailySpendingChart({ data, onBarClick, selectedDate }: DailySpendingChartProps) {
    const { symbol } = useCurrency();

    return (
        <div className="h-[250px] w-full">
            <ChartContainer
                config={{
                    amount: { label: "Spending", color: "var(--primary)" },
                }}
                className="h-full w-full min-w-0 aspect-auto"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
                    >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/0.1)" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={12}
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            interval="preserveStartEnd"
                            minTickGap={30}
                        />

                        <ChartTooltip
                            cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        {label}
                                                    </span>
                                                    <span className="font-bold text-muted-foreground">
                                                        {symbol}{Number(payload[0].value).toLocaleString()}
                                                    </span>
                                                    {(payload[0].payload.count > 0) && (
                                                        <div className="mt-2 text-[0.65rem] text-muted-foreground/80 space-y-0.5 border-t border-border/50 pt-1.5">
                                                            <div className="flex justify-between gap-3">
                                                                <span>Transactions:</span>
                                                                <span className="font-medium text-foreground">{payload[0].payload.count}</span>
                                                            </div>
                                                            {payload[0].payload.topCategory && (
                                                                <div className="flex justify-between gap-3">
                                                                    <span>Top:</span>
                                                                    <span className="font-medium text-foreground truncate max-w-[80px]">
                                                                        {payload[0].payload.topCategory}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Bar
                            dataKey="amount"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                            onClick={(data: any) => {
                                // Recharts passes the payload in the data object for Bar clicks
                                const date = data?.payload?.date || data?.date;
                                if (onBarClick && date) {
                                    onBarClick(date);
                                }
                            }}
                            className="cursor-pointer"
                        >
                            {/* Optional: Add active cell styling or different colors based on thresholds */}
                            {data.map((entry, index) => {
                                const isSelected = selectedDate === entry.date;
                                const isAnySelected = !!selectedDate;
                                // Use gradient for active/selected items, solid transparent for unselected
                                const fill = !isAnySelected || isSelected
                                    ? "#22C55E"
                                    : "#22C55E";
                                const opacity = !isAnySelected || isSelected ? 1 : 0.1;

                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={fill}
                                        fillOpacity={opacity}
                                        className="transition-all duration-300 hover:opacity-80"
                                    />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>
    );
}
