'use client';

import { useMemo, useState } from 'react';
import { TrendingUp, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DailySpendingChart } from '@/components/features/charts/daily-spending-chart';
import { ExpenseDonutChart } from '@/components/features/charts/expense-donut-chart';
import { CategoryIcon } from '@/components/features/categories/category-icon';
import { useCurrency } from '@/hooks/use-currency';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface CategoryData {
    id: string;
    name: string;
    value: number;
    color: string;
    icon: string;
}

interface SpendingOverviewProps {
    expenses: any[]; // Raw expense transaction list
}

export function SpendingOverview({ expenses }: SpendingOverviewProps) {
    const { symbol } = useCurrency();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // 1. Calculate Trend Data (Last 7 Days)
    const trendData = useMemo(() => {
        const today = new Date();
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - i));
            return d;
        });

        return days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayName = format(day, 'EEE');

            // Filter expenses for this day
            const dayExpenses = expenses.filter(t =>
                // Handle ISO string vs Date object
                (typeof t.date === 'string' ? t.date.startsWith(dayStr) : format(t.date, 'yyyy-MM-dd') === dayStr)
            );

            const amount = dayExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
            const count = dayExpenses.length;

            // Find top category for the day
            const catMap = new Map<string, number>();
            dayExpenses.forEach(t => {
                const catName = t.category?.name || 'Unknown';
                catMap.set(catName, (catMap.get(catName) || 0) + Number(t.amount));
            });

            let topCategory = '';
            let maxVal = 0;
            catMap.forEach((val, key) => {
                if (val > maxVal) {
                    maxVal = val;
                    topCategory = key;
                }
            });

            return {
                date: dayName,
                fullDate: dayStr, // usable for filtering
                amount,
                count,
                topCategory
            };
        });
    }, [expenses]);

    // 2. Calculate Expense Data (Categories) based on selection
    const expenseData = useMemo(() => {
        const categoryMap = new Map<string, CategoryData>();

        // Determine filter date
        let targetDateStr: string | null = null;

        if (selectedDate) {
            // Find the full date string corresponding to the selected day name (e.g. "Mon")
            // We rely on trendData having the mapping
            const match = trendData.find(d => d.date === selectedDate);
            if (match) targetDateStr = match.fullDate;
        }

        expenses.forEach(t => {
            const tDateStr = typeof t.date === 'string' ? t.date.split('T')[0] : format(t.date, 'yyyy-MM-dd');

            // Filter if date selected
            if (targetDateStr && tDateStr !== targetDateStr) return;

            // If no date selected, maybe we want current week or whole month?
            // The original code passed 'currentMonth' stats. 
            // If we passed ALL month expenses, then default is ALL month.
            // But trend chart is only last 7 days.
            // Usually "Spending Overview" pie chart matches the context.
            // If user sees 7 days trend, maybe pie chart should be 7 days too?
            // OLD CODE: "if selectedDate... else Weekly: Process last 7 days"

            if (!targetDateStr) {
                // Default to last 7 days to match the chart above it
                const today = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(today.getDate() - 6);
                sevenDaysAgo.setHours(0, 0, 0, 0);

                const tDate = new Date(t.date);
                if (tDate < sevenDaysAgo) return;
            }

            const cat = t.category || { name: 'Unknown', color: '#ccc', icon: 'circle', id: 'unknown' };
            const catId = t.categoryId || cat.id || 'unknown';

            const existing = categoryMap.get(catId) || {
                id: catId,
                name: cat.name,
                value: 0,
                color: cat.color,
                icon: cat.icon
            };
            existing.value += Number(t.amount);
            categoryMap.set(catId, existing);
        });

        const sortedCategories = Array.from(categoryMap.values())
            .sort((a, b) => b.value - a.value);

        // Limit to top 4 + Other
        if (sortedCategories.length <= 4) return sortedCategories;

        const topCategories = sortedCategories.slice(0, 3);
        const otherCategories = sortedCategories.slice(3);
        const otherValue = otherCategories.reduce((sum, cat) => sum + cat.value, 0);

        return [
            ...topCategories,
            {
                id: 'other',
                name: 'Other',
                value: otherValue,
                color: '#94a3b8',
                icon: 'more-horizontal'
            }
        ];

    }, [expenses, selectedDate, trendData]);

    return (
        <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-lg">Spending Overview</h3>
            </div>
            <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-card overflow-hidden">
                <CardContent className="p-6 lg:p-8 space-y-8">
                    {/* Trend Chart (Top) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 dark:bg-[#98EF5A]/10 flex items-center justify-center text-emerald-600 dark:text-[#98EF5A]">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Activity Trend</h4>
                                <p className="text-xs text-muted-foreground">Spending over time</p>
                            </div>
                        </div>
                        <DailySpendingChart
                            data={trendData}
                            onBarClick={(date) => setSelectedDate(selectedDate === date ? null : date)}
                            selectedDate={selectedDate}
                        />
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Donut Chart (Bottom) */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <ArrowDownRight className="h-4 w-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Expense Breakdown</h4>
                                <p className="text-xs text-muted-foreground">
                                    {selectedDate
                                        ? `Breakdown for ${selectedDate}`
                                        : 'Where your money went (Last 7 Days)'}
                                </p>
                            </div>
                        </div>

                        {expenseData.length > 0 ? (
                            <div className="flex flex-col sm:flex-row gap-8 items-center">
                                <div className="w-full sm:w-1/2 flex justify-center">
                                    <ExpenseDonutChart
                                        data={expenseData}
                                        totalAmount={expenseData.reduce((acc, item) => acc + item.value, 0)}
                                    />
                                </div>

                                <div className="w-full sm:w-1/2 space-y-3">
                                    {expenseData.map((item, index) => {
                                        const total = expenseData.reduce((acc, i) => acc + i.value, 0);
                                        const percentage = total > 0 ? (item.value / total) * 100 : 0;

                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="space-y-1"
                                            >
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}20` }}>
                                                            <CategoryIcon icon={item.icon} color={item.color} size="sm" />
                                                        </div>
                                                        <span className="font-medium text-xs">{item.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-bold text-xs">{symbol}{item.value.toLocaleString()}</span>
                                                        <span className="text-[10px] text-muted-foreground ml-1">({percentage.toFixed(0)}%)</span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${percentage}%`,
                                                            backgroundColor: item.color
                                                        }}
                                                    />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm">No expenses in this period</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
