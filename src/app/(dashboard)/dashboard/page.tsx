'use client';

import { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
    Bell,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    MoreHorizontal
} from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { useTransactions } from '@/context/transactions-context';
import { useBudgets } from '@/context/budgets-context';
import { useCurrency } from '@/hooks/use-currency';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/animations';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { ExpenseDonutChart } from '@/components/features/charts/expense-donut-chart';
import { SpendingTrendChart } from '@/components/features/charts/spending-trend-chart';
import { RecentTransactions } from '@/components/features/transactions/recent-transactions';

function DashboardHeader({ user }: { user: any }) {
    return (
        <div className="flex items-center justify-between py-4 px-2">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                    <AvatarImage src={user?.image} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-sm font-medium text-muted-foreground">Welcome back,</h1>
                    <p className="text-lg font-bold text-foreground leading-none">{user?.name?.split(' ')[0]}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:text-foreground">
                    <Search className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-border/50 shadow-sm relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-background" />
                </Button>
            </div>
        </div>
    );
}

// Placeholder for charts
function ExpenseChartPlaceholder() {
    return (
        <div className="h-[300px] w-full bg-muted/20 rounded-3xl animate-pulse flex items-center justify-center text-muted-foreground text-sm">
            Expense Donut Chart Area
        </div>
    );
}

function TrendChartPlaceholder() {
    return (
        <div className="h-[200px] w-full bg-muted/20 rounded-3xl animate-pulse flex items-center justify-center text-muted-foreground text-sm">
            Trend Chart Area
        </div>
    );
}

export default function DashboardPage() {
    const { user } = useAuth();
    const { formatCurrency, symbol } = useCurrency();

    const { transactions, getMonthlyIncome, getMonthlyExpenses } = useTransactions();
    const { getBudgetByMonth } = useBudgets();
    const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly');
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [monthlyExpense, setMonthlyExpense] = useState(0);
    const currentMonth = format(new Date(), 'yyyy-MM');

    // Fetch monthly totals from database
    useEffect(() => {
        const fetchMonthlyTotals = async () => {
            const [income, expenses] = await Promise.all([
                getMonthlyIncome(currentMonth),
                getMonthlyExpenses(currentMonth)
            ]);
            setMonthlyIncome(income);
            setMonthlyExpense(expenses);
        };
        fetchMonthlyTotals();
    }, [currentMonth, getMonthlyIncome, getMonthlyExpenses]);

    // Get budget and calculate daily allowance
    const currentBudget = getBudgetByMonth(currentMonth);

    // Calculate today's spending
    const todaySpending = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return transactions
            .filter(t =>
                t.type === 'expense' &&
                format(new Date(t.date), 'yyyy-MM-dd') === today
            )
            .reduce((sum, t) => sum + t.amount, 0);
    }, [transactions]);

    const dailyAllowance = useMemo(() => {
        if (!currentBudget) return 0;

        const budgetRemaining = currentBudget.totalAmount - monthlyExpense;
        const today = new Date();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysRemaining = Math.max(1, lastDayOfMonth.getDate() - today.getDate() + 1);

        const dailyBudget = budgetRemaining / daysRemaining;

        // Subtract today's spending to show how much MORE can be spent
        return dailyBudget - todaySpending;
    }, [currentBudget, monthlyExpense, todaySpending]);

    // Total balance is income - expenses for current month
    const totalBalance = useMemo(() => {
        return monthlyIncome - monthlyExpense;
    }, [monthlyIncome, monthlyExpense]);

    const expenseData = useMemo(() => {
        let filteredTransactions = transactions.filter(t => t.type === 'expense');

        if (timeRange === 'weekly') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= oneWeekAgo);
        } else {
            // Monthly - match current month
            filteredTransactions = filteredTransactions.filter(t => format(new Date(t.date), 'yyyy-MM') === currentMonth);
        }

        // Group by category
        const categoryMap = new Map<string, { name: string; value: number; color: string }>();

        filteredTransactions.forEach(t => {
            const existing = categoryMap.get(t.categoryId) || {
                name: t.category.name,
                value: 0,
                color: t.category.color || '#cbd5e1'
            };
            existing.value += t.amount;
            categoryMap.set(t.categoryId, existing);
        });

        // Convert to array and sort by value
        const sortedCategories = Array.from(categoryMap.values())
            .sort((a, b) => b.value - a.value);

        // Take top 4 or return empty state if no data
        if (sortedCategories.length === 0) {
            return [{ name: 'No Data', value: 1, color: '#e2e8f0' }];
        }

        return sortedCategories.slice(0, 4);
    }, [transactions, currentMonth, timeRange]);

    const trendData = useMemo(() => {
        let days: Date[];
        const today = new Date();

        if (timeRange === 'weekly') {
            days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(today);
                d.setDate(today.getDate() - (6 - i));
                return d;
            });
        } else {
            // Monthly: Show dates from 1st to today
            const year = today.getFullYear();
            const month = today.getMonth();
            const daysInMonthSoFar = today.getDate();

            days = Array.from({ length: daysInMonthSoFar }, (_, i) => {
                return new Date(year, month, i + 1);
            });
        }

        return days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            // For monthly view, just show date number. For weekly, show day name.
            // If it's a new year/month boundary situation, might be good to stay simple.
            const dayName = timeRange === 'weekly' ? format(day, 'EEE') : format(day, 'd');

            const dayAmount = transactions
                .filter(t =>
                    t.type === 'expense' &&
                    format(new Date(t.date), 'yyyy-MM-dd') === dayStr
                )
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                date: dayName,
                amount: dayAmount
            };
        });
    }, [transactions, timeRange]);

    return (
        <div className="min-h-screen bg-neutral-50/50 dark:bg-background pb-24 lg:pb-8">
            {/* Main Container - Responsive width */}
            <div className="max-w-md lg:max-w-7xl mx-auto px-4 lg:px-8 space-y-6 lg:space-y-8">

                <DashboardHeader user={user} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left Column: Stats & Charts */}
                    <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                        {/* Main Balance Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative"
                        >
                            <div className="absolute inset-x-4 top-4 bottom-0 bg-primary/20 blur-xl rounded-full opacity-50" />
                            <Card className="rounded-[2rem] border-none shadow-xl bg-card text-card-foreground overflow-hidden relative z-10 lg:h-[300px] flex flex-col justify-center">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full -ml-24 -mb-24 blur-2xl pointer-events-none" />

                                <CardContent className="p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 h-full">
                                    <div className="space-y-2 text-center lg:text-left z-10">
                                        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Total Balance</p>
                                        <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                                            {symbol}<AnimatedNumber value={totalBalance} />
                                        </h2>
                                        <p className="text-muted-foreground text-sm mt-1">
                                            {monthlyIncome > monthlyExpense ? 'On track ' : 'Over budget '}
                                            for this month
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 w-full lg:w-auto min-w-[300px]">
                                        <div className="bg-muted/50 rounded-2xl p-4 backdrop-blur-md border border-border/50 transition-colors hover:bg-muted/80">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="bg-primary/20 p-2 rounded-full">
                                                    <ArrowDownRight className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="text-sm font-medium text-muted-foreground">Income</span>
                                            </div>
                                            <p className="font-bold text-xl text-foreground">{symbol}{monthlyIncome.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-muted/50 rounded-2xl p-4 backdrop-blur-md border border-border/50 transition-colors hover:bg-muted/80">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="bg-red-500/10 p-2 rounded-full">
                                                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                                                </div>
                                                <span className="text-sm font-medium text-muted-foreground">Expense</span>
                                            </div>
                                            <p className="font-bold text-xl text-foreground">{symbol}{monthlyExpense.toLocaleString()}</p>
                                        </div>
                                        {currentBudget && (
                                            <div className="col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 backdrop-blur-md border border-primary/20 transition-colors hover:from-primary/15 hover:to-primary/10">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-primary/20 p-2 rounded-full">
                                                            <TrendingUp className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <span className="text-sm font-medium text-muted-foreground">Can Spend Today</span>
                                                    </div>
                                                    {todaySpending > 0 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Spent: {symbol}{todaySpending.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={cn(
                                                    "font-bold text-xl",
                                                    dailyAllowance >= 0 ? "text-primary" : "text-red-500"
                                                )}>
                                                    {symbol}{Math.abs(dailyAllowance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {dailyAllowance >= 0 ? 'Remaining for today' : 'Over daily budget'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Charts Grid */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="font-bold text-lg">Spending Overview</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full h-8 text-xs font-medium"
                                    onClick={() => setTimeRange((prev: 'weekly' | 'monthly') => prev === 'weekly' ? 'monthly' : 'weekly')}
                                >
                                    {timeRange === 'weekly' ? 'Weekly' : 'Monthly'} <ArrowDownRight className="ml-1 h-3 w-3 text-muted-foreground" />
                                </Button>
                            </div>
                            <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-card overflow-hidden">
                                <CardContent className="p-6 lg:p-8 space-y-8">
                                    {/* Trend Chart (Top) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <TrendingUp className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">Activity Trend</h4>
                                                <p className="text-xs text-muted-foreground">Spending over time</p>
                                            </div>
                                        </div>
                                        <SpendingTrendChart data={trendData} />
                                    </div>

                                    <Separator className="bg-border/50" />

                                    {/* Donut Chart (Bottom) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                <ArrowDownRight className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">Expense Breakdown</h4>
                                                <p className="text-xs text-muted-foreground">Where your money went</p>
                                            </div>
                                        </div>
                                        <ExpenseDonutChart
                                            data={expenseData}
                                            totalAmount={expenseData.reduce((acc, item) => acc + item.value, 0)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Right Column: Transactions */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-6">
                            <RecentTransactions />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
