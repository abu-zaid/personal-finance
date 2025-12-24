import { useMemo, useState, useEffect } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, eachWeekOfInterval, isSameWeek } from 'date-fns';
import { useTransactions } from '@/context/transactions-context';
import { useCategories } from '@/context/categories-context';
import { useBudgets } from '@/context/budgets-context';
import { getMonthString } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';

export function useInsightsData() {
    const { transactions, getMonthlyTotal, getMonthlyExpenses } = useTransactions();
    const { categories } = useCategories();
    const { getBudgetByMonth } = useBudgets();
    const { formatCurrency } = useCurrency();

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const currentMonth = getMonthString(new Date());
    const previousMonth = getMonthString(subMonths(new Date(), 1));

    // Current month data
    const currentMonthTransactions = useMemo(() => {
        return transactions.filter((t) => {
            const transactionMonth = getMonthString(new Date(t.date));
            return transactionMonth === currentMonth && t.type === 'expense';
        });
    }, [transactions, currentMonth]);

    // Fetch monthly totals from database
    const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
    const [previousMonthTotal, setPreviousMonthTotal] = useState(0);

    useEffect(() => {
        const fetchMonthlyTotals = async () => {
            const [current, previous] = await Promise.all([
                getMonthlyExpenses(currentMonth),
                getMonthlyExpenses(previousMonth)
            ]);
            setCurrentMonthTotal(current);
            setPreviousMonthTotal(previous);
        };
        fetchMonthlyTotals();
    }, [currentMonth, previousMonth, getMonthlyExpenses]);

    // Budget data
    const currentBudget = getBudgetByMonth(currentMonth);
    const budgetUsage = currentBudget ? (currentMonthTotal / currentBudget.totalAmount) * 100 : 0;
    const budgetRemaining = currentBudget ? currentBudget.totalAmount - currentMonthTotal : 0;

    // Month-over-month change
    const monthChange = previousMonthTotal > 0
        ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
        : 0;

    // Last 6 months trend data for line chart - use in-memory calculation to avoid 6 DB queries
    const monthlyTrendData = useMemo(() => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const month = getMonthString(date);
            const monthTransactions = transactions.filter(
                (t) => getMonthString(new Date(t.date)) === month && t.type === 'expense'
            );
            const value = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
            months.push({
                label: format(date, 'MMM'),
                value,
            });
        }
        return months;
    }, [transactions]);

    // Category breakdown
    const categoryBreakdown = useMemo(() => {
        const breakdown = categories.map((category) => {
            const categoryTransactions = currentMonthTransactions.filter(
                (t) => t.categoryId === category.id
            );
            const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
            const count = categoryTransactions.length;

            // Previous month comparison
            const prevCategoryTransactions = transactions.filter(
                (t) => t.categoryId === category.id &&
                    getMonthString(new Date(t.date)) === previousMonth &&
                    t.type === 'expense'
            );
            const prevTotal = prevCategoryTransactions.reduce((sum, t) => sum + t.amount, 0);
            const change = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

            return { category, total, count, prevTotal, change };
        });

        return breakdown
            .filter((item) => item.total > 0)
            .sort((a, b) => b.total - a.total);
    }, [currentMonthTransactions, transactions, categories, previousMonth]);

    // Category changes (biggest increase/decrease)
    const { biggestIncrease, biggestDecrease } = useMemo(() => {
        const changes = categoryBreakdown.map(item => {
            const prevTotal = transactions
                .filter(t => t.categoryId === item.category.id &&
                    getMonthString(new Date(t.date)) === previousMonth &&
                    t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            if (prevTotal === 0) return null;

            const change = ((item.total - prevTotal) / prevTotal) * 100;
            return { ...item, prevTotal, change };
        }).filter(Boolean);

        const increases = changes.filter(c => c && c.change > 0).sort((a, b) => b!.change - a!.change);
        const decreases = changes.filter(c => c && c.change < 0).sort((a, b) => a!.change - b!.change);

        return {
            biggestIncrease: increases.length > 0 ? increases[0] : null,
            biggestDecrease: decreases.length > 0 ? decreases[0] : null,
        };
    }, [categoryBreakdown, transactions, previousMonth]);

    const totalCurrentMonth = categoryBreakdown.reduce((sum, item) => sum + item.total, 0);

    // Category spending over time (last 6 months)
    const categoryTrendData = useMemo(() => {
        if (!selectedCategory) return [];

        const category = categories.find(c => c.id === selectedCategory);
        if (!category) return [];

        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const month = getMonthString(date);
            const monthTransactions = transactions.filter(
                (t) => t.categoryId === selectedCategory &&
                    getMonthString(new Date(t.date)) === month &&
                    t.type === 'expense'
            );
            const total = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
            months.push({
                label: format(date, 'MMM'),
                value: total,
            });
        }

        return [{
            name: category.name,
            data: months,
            color: category.color,
        }];
    }, [selectedCategory, categories, transactions]);

    // Budget vs Actual for categories
    const categoryBudgetComparison = useMemo(() => {
        if (!currentBudget) return [];

        return categoryBreakdown.map(item => {
            const categoryBudget = currentBudget.allocations.find(
                cb => cb.categoryId === item.category.id
            );
            const budgetAmount = categoryBudget?.amount || 0;
            const usage = budgetAmount > 0 ? (item.total / budgetAmount) * 100 : 0;

            return {
                ...item,
                budgetAmount,
                usage,
            };
        }).filter(item => item.budgetAmount > 0);
    }, [categoryBreakdown, currentBudget]);

    // Daily spending data for current month
    const dailySpendingData = useMemo(() => {
        const start = startOfMonth(new Date());
        const end = endOfMonth(new Date());
        const days = eachDayOfInterval({ start, end });

        return days.map(day => {
            const dayTransactions = currentMonthTransactions.filter(t =>
                isSameDay(new Date(t.date), day)
            );
            const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
            return {
                label: format(day, 'd'),
                date: day,
                value: total,
            };
        });
    }, [currentMonthTransactions]);

    // Weekly spending data
    const weeklySpendingData = useMemo(() => {
        const start = startOfMonth(new Date());
        const end = endOfMonth(new Date());
        const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }); // Monday start

        return weeks.map((weekStart, index) => {
            // Filter transactions for this week
            const weekTransactions = currentMonthTransactions.filter(t =>
                isSameWeek(new Date(t.date), weekStart, { weekStartsOn: 1 })
            );
            const total = weekTransactions.reduce((sum, t) => sum + t.amount, 0);

            return {
                label: `Week ${index + 1}`,
                fullLabel: `${format(weekStart, 'MMM d')} - ${format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d')}`,
                value: total,
            };
        });
    }, [currentMonthTransactions]);

    // Trend Stats
    const { sixMonthAverage, highestMonth } = useMemo(() => {
        if (monthlyTrendData.length === 0) return { sixMonthAverage: 0, highestMonth: null };

        const total = monthlyTrendData.reduce((sum, item) => sum + item.value, 0);
        const avg = total / monthlyTrendData.length;

        const max = [...monthlyTrendData].sort((a, b) => b.value - a.value)[0];

        return {
            sixMonthAverage: avg,
            highestMonth: max,
        };
    }, [monthlyTrendData]);

    // Financial health score (0-100)
    const healthScore = useMemo(() => {
        let score = 100;

        // Budget adherence (40 points)
        if (currentBudget) {
            if (budgetUsage > 100) {
                score -= 40;
            } else if (budgetUsage > 90) {
                score -= 30;
            } else if (budgetUsage > 80) {
                score -= 20;
            } else if (budgetUsage > 70) {
                score -= 10;
            }
        }

        // Spending trend (30 points)
        if (monthChange > 20) {
            score -= 30;
        } else if (monthChange > 10) {
            score -= 20;
        } else if (monthChange > 5) {
            score -= 10;
        } else if (monthChange < -10) {
            score += 10; // Bonus for reducing spending
        }

        // Category diversity (30 points)
        if (categoryBreakdown.length > 0) {
            const topCategoryPercentage = (categoryBreakdown[0].total / totalCurrentMonth) * 100;
            if (topCategoryPercentage > 60) {
                score -= 30;
            } else if (topCategoryPercentage > 50) {
                score -= 20;
            } else if (topCategoryPercentage > 40) {
                score -= 10;
            }
        }

        return Math.max(0, Math.min(100, score));
    }, [currentBudget, budgetUsage, monthChange, categoryBreakdown, totalCurrentMonth]);

    // Daily average and projection
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysElapsed = new Date().getDate();
    const daysRemaining = daysInMonth - daysElapsed;
    const dailyAverage = daysElapsed > 0 ? currentMonthTotal / daysElapsed : 0;
    const projectedTotal = currentMonthTotal + (dailyAverage * daysRemaining);
    const recommendedDailySpend = currentBudget && daysRemaining > 0
        ? (currentBudget.totalAmount - currentMonthTotal) / daysRemaining
        : 0;

    return {
        transactions,
        currentMonth,
        previousMonth,
        currentMonthTotal,
        previousMonthTotal,
        currentBudget,
        budgetUsage,
        budgetRemaining,
        monthChange,
        monthlyTrendData,
        categoryBreakdown,
        totalCurrentMonth,
        selectedCategory,
        setSelectedCategory,
        categoryTrendData,
        categoryBudgetComparison,
        dailySpendingData,
        weeklySpendingData,
        sixMonthAverage,
        highestMonth,
        healthScore,
        dailyAverage,
        projectedTotal,
        recommendedDailySpend,
        biggestIncrease,
        biggestDecrease,
        daysInMonth,
        daysElapsed,
        formatCurrency,
        currentMonthTransactions,
    };
}
