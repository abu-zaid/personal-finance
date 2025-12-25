import { TrendingUp, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DailySpendingChart } from '@/components/features/charts/daily-spending-chart';
import { ExpenseDonutChart } from '@/components/features/charts/expense-donut-chart';
import { CategoryIcon } from '@/components/features/categories/category-icon';
import { useCurrency } from '@/hooks/use-currency';
import { motion } from 'framer-motion';

interface SpendingOverviewProps {
    trendData: any[];
    expenseData: any[];
    selectedDate: string | null;
    setSelectedDate: (date: string | null) => void;
}

export function SpendingOverview({
    trendData,
    expenseData,
    selectedDate,
    setSelectedDate
}: SpendingOverviewProps) {
    const { symbol } = useCurrency();
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
                                        : 'Where your money went'}
                                </p>
                            </div>
                        </div>

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
                                            key={item.name}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="space-y-1"
                                        >
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1 rounded-md" style={{ backgroundColor: `${item.color}20` }}>
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
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
