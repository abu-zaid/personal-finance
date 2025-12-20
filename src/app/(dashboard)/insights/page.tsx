'use client';

import { useMemo, useState } from 'react';
import { format, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem, AnimatedNumber } from '@/components/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared';
import { CategoryIcon } from '@/components/features/categories';
import { useTransactions } from '@/context/transactions-context';
import { useCategories } from '@/context/categories-context';
import { useBudgets } from '@/context/budgets-context';
import { cn, getMonthString } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Target,
  Flame,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Clock
} from 'lucide-react';
import { DonutChart } from '@/components/charts';

export default function InsightsPage() {
  const { transactions, getMonthlyTotal } = useTransactions();
  const { categories } = useCategories();
  const { getBudgetByMonth } = useBudgets();
  const { formatCurrency, symbol } = useCurrency();

  const [activeTab, setActiveTab] = useState('overview');

  const currentMonth = getMonthString(new Date());
  const previousMonth = getMonthString(subMonths(new Date(), 1));

  // Current month transactions
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const transactionMonth = getMonthString(new Date(t.date));
      return transactionMonth === currentMonth;
    });
  }, [transactions, currentMonth]);

  // Previous month transactions
  const previousMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const transactionMonth = getMonthString(new Date(t.date));
      return transactionMonth === previousMonth;
    });
  }, [transactions, previousMonth]);

  // Monthly totals
  const currentMonthTotal = getMonthlyTotal(currentMonth);
  const previousMonthTotal = getMonthlyTotal(previousMonth);

  // Month-over-month change
  const monthChange = previousMonthTotal > 0
    ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
    : 0;

  // Last 6 months data
  const monthlyData = useMemo(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const month = getMonthString(date);
      result.push({
        month,
        label: format(date, 'MMM'),
        fullLabel: format(date, 'MMMM'),
        total: getMonthlyTotal(month),
      });
    }
    return result;
  }, [getMonthlyTotal]);

  const maxMonthlySpend = Math.max(...monthlyData.map((d) => d.total), 1);
  const averageMonthlySpend = monthlyData.reduce((sum, d) => sum + d.total, 0) / 6;

  // Category breakdown for current month
  const categoryBreakdown = useMemo(() => {
    const breakdown = categories.map((category) => {
      const categoryTransactions = currentMonthTransactions.filter(
        (t) => t.categoryId === category.id
      );
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const count = categoryTransactions.length;

      // Previous month comparison
      const prevCategoryTransactions = previousMonthTransactions.filter(
        (t) => t.categoryId === category.id
      );
      const prevTotal = prevCategoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const change = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

      return { category, total, count, prevTotal, change };
    });

    return breakdown
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [currentMonthTransactions, previousMonthTransactions, categories]);

  const totalCurrentMonth = categoryBreakdown.reduce((sum, item) => sum + item.total, 0);

  // Top spending category
  const topCategory = categoryBreakdown[0];

  // Biggest increase/decrease categories
  const biggestIncrease = useMemo(() => {
    return categoryBreakdown
      .filter(c => c.prevTotal > 0 && c.change > 0)
      .sort((a, b) => b.change - a.change)[0];
  }, [categoryBreakdown]);

  const biggestDecrease = useMemo(() => {
    return categoryBreakdown
      .filter(c => c.prevTotal > 0 && c.change < 0)
      .sort((a, b) => a.change - b.change)[0];
  }, [categoryBreakdown]);

  // Weekly spending (current week)
  const weeklySpending = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return days.map(day => {
      const dayTransactions = transactions.filter(t =>
        isSameDay(new Date(t.date), day)
      );
      const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
      return {
        day: format(day, 'EEE'),
        date: day,
        total,
        isToday: isSameDay(day, now),
      };
    });
  }, [transactions]);

  const maxDailySpend = Math.max(...weeklySpending.map(d => d.total), 1);
  const weekTotal = weeklySpending.reduce((sum, d) => sum + d.total, 0);

  // Daily average
  const dailyAverage = currentMonthTotal / new Date().getDate();

  // Budget status
  const currentBudget = getBudgetByMonth(currentMonth);
  const budgetUsage = currentBudget ? (currentMonthTotal / currentBudget.totalAmount) * 100 : 0;
  const budgetRemaining = currentBudget ? currentBudget.totalAmount - currentMonthTotal : 0;

  // Spending streak (consecutive days with transactions)
  const spendingStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const hasTransaction = transactions.some(t =>
        isSameDay(new Date(t.date), checkDate)
      );
      if (hasTransaction) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [transactions]);

  // Transaction count stats
  const transactionCount = currentMonthTransactions.length;
  const avgTransactionAmount = transactionCount > 0 ? currentMonthTotal / transactionCount : 0;

  // NEW: Day of week spending patterns
  const dayOfWeekSpending = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const totals = new Array(7).fill(0);
    const counts = new Array(7).fill(0);

    currentMonthTransactions.forEach(t => {
      const dayIndex = new Date(t.date).getDay();
      totals[dayIndex] += t.amount;
      counts[dayIndex]++;
    });

    const maxTotal = Math.max(...totals, 1);

    return days.map((day, index) => ({
      day,
      total: totals[index],
      count: counts[index],
      average: counts[index] > 0 ? totals[index] / counts[index] : 0,
      intensity: (totals[index] / maxTotal) * 100,
    }));
  }, [currentMonthTransactions]);

  if (transactions.length === 0) {
    return (
      <PageTransition>
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold lg:text-2xl">Insights</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Understand your spending patterns</p>
          </div>
          <Card>
            <EmptyState
              icon={<BarChart3 className="h-10 w-10" />}
              title="No data yet"
              description="Add some transactions to see insights about your spending patterns and trends."
            />
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold lg:text-2xl">Insights</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {format(new Date(), 'MMMM yyyy')} spending analysis
          </p>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Key Metrics */}
            <StaggerContainer>
              <div className="grid gap-3 grid-cols-2">
                <StaggerItem>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                          <Wallet className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs text-muted-foreground">This Month</span>
                      </div>
                      <div className="text-lg sm:text-xl font-bold">
                        <AnimatedNumber value={currentMonthTotal} format="currency" />
                      </div>
                      <div className="mt-1 flex items-center text-xs">
                        {monthChange > 0 ? (
                          <>
                            <ArrowUpRight className="mr-0.5 h-3 w-3 text-destructive" />
                            <span className="text-destructive">{monthChange.toFixed(0)}%</span>
                          </>
                        ) : monthChange < 0 ? (
                          <>
                            <ArrowDownRight className="mr-0.5 h-3 w-3 text-primary" />
                            <span className="text-primary">{Math.abs(monthChange).toFixed(0)}%</span>
                          </>
                        ) : (
                          <>
                            <Minus className="mr-0.5 h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">0%</span>
                          </>
                        )}
                        <span className="text-muted-foreground ml-1">vs last month</span>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>

                <StaggerItem>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-blue-500/10">
                          <Calendar className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="text-xs text-muted-foreground">Daily Avg</span>
                      </div>
                      <div className="text-lg sm:text-xl font-bold">
                        <AnimatedNumber value={dailyAverage} format="currency" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transactionCount} transactions
                      </p>
                    </CardContent>
                  </Card>
                </StaggerItem>

                <StaggerItem>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-purple-500/10">
                          <Target className="h-4 w-4 text-purple-500" />
                        </div>
                        <span className="text-xs text-muted-foreground">Avg Transaction</span>
                      </div>
                      <div className="text-lg sm:text-xl font-bold">
                        <AnimatedNumber value={avgTransactionAmount} format="currency" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        per expense
                      </p>
                    </CardContent>
                  </Card>
                </StaggerItem>

                <StaggerItem>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-orange-500/10">
                          <Flame className="h-4 w-4 text-orange-500" />
                        </div>
                        <span className="text-xs text-muted-foreground">Streak</span>
                      </div>
                      <div className="text-lg sm:text-xl font-bold">
                        {spendingStreak} days
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        spending streak
                      </p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              </div>
            </StaggerContainer>

            {/* Budget Status (if exists) */}
            {currentBudget && (
              <FadeIn>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <PiggyBank className="h-4 w-4" />
                        Budget Status
                      </CardTitle>
                      <span className={cn(
                        "text-sm font-medium",
                        budgetUsage >= 100 ? "text-destructive" : budgetUsage >= 80 ? "text-yellow-500" : "text-primary"
                      )}>
                        {budgetUsage.toFixed(0)}% used
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress
                      value={Math.min(budgetUsage, 100)}
                      className={cn("h-3", {
                        "[&>div]:bg-primary": budgetUsage < 80,
                        "[&>div]:bg-yellow-500": budgetUsage >= 80 && budgetUsage < 100,
                        "[&>div]:bg-destructive": budgetUsage >= 100,
                      })}
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatCurrency(currentMonthTotal)} of {formatCurrency(currentBudget.totalAmount)}
                      </span>
                      <span className={cn(
                        "font-medium",
                        budgetRemaining >= 0 ? "text-primary" : "text-destructive"
                      )}>
                        {budgetRemaining >= 0
                          ? `${formatCurrency(budgetRemaining)} left`
                          : `${formatCurrency(Math.abs(budgetRemaining))} over`
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {/* This Week */}
            <FadeIn>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">This Week</CardTitle>
                    <span className="text-sm text-muted-foreground">{formatCurrency(weekTotal)}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between gap-2 h-24">
                    {weeklySpending.map((day, index) => (
                      <motion.div
                        key={day.day}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className="flex-1 flex flex-col items-center gap-1"
                        style={{ originY: 1 }}
                      >
                        <div
                          className={cn(
                            "w-full rounded-t-md transition-all",
                            day.isToday ? "bg-primary" : "bg-primary/30 dark:bg-primary/40"
                          )}
                          style={{
                            height: day.total > 0 ? `${Math.max((day.total / maxDailySpend) * 60, 4)}px` : '4px',
                          }}
                        />
                        <span className={cn(
                          "text-[10px] font-medium",
                          day.isToday ? "text-primary" : "text-muted-foreground"
                        )}>
                          {day.day}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Top Category */}
            {topCategory && (
              <FadeIn>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Top Spending Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <CategoryIcon
                        icon={topCategory.category.icon}
                        color={topCategory.category.color}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{topCategory.category.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {topCategory.count} transactions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-base sm:text-lg">{formatCurrency(topCategory.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          {((topCategory.total / totalCurrentMonth) * 100).toFixed(0)}% of total
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {/* NEW: Day of Week Spending Heatmap */}
            <FadeIn>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Spending by Day of Week
                  </CardTitle>
                  <CardDescription>When do you spend the most?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dayOfWeekSpending.map((day, index) => (
                      <motion.div
                        key={day.day}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="space-y-1"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground w-24">{day.day}</span>
                          <span className="font-semibold">{formatCurrency(day.total)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-8 bg-muted/30 rounded-lg overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${day.intensity}%` }}
                              transition={{ duration: 0.6, delay: index * 0.05 + 0.2 }}
                              className="h-full rounded-lg"
                              style={{
                                background: `linear-gradient(90deg, ${day.intensity > 80 ? '#ef4444' :
                                    day.intensity > 60 ? '#f59e0b' :
                                      day.intensity > 40 ? '#3b82f6' :
                                        '#98EF5A'
                                  } 0%, ${day.intensity > 80 ? '#dc2626' :
                                    day.intensity > 60 ? '#d97706' :
                                      day.intensity > 40 ? '#2563eb' :
                                        '#7BEA3C'
                                  } 100%)`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-16 text-right">
                            {day.count} txns
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4 mt-4">
            {/* 6 Month Trend */}
            <FadeIn>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">6 Month Trend</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      Avg: {formatCurrency(averageMonthlySpend)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthlyData.map((data, index) => {
                      const percentage = (data.total / maxMonthlySpend) * 100;
                      const isCurrentMonth = data.month === currentMonth;
                      return (
                        <motion.div
                          key={data.month}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="space-y-1"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className={cn(
                              "font-medium",
                              isCurrentMonth && "text-primary"
                            )}>
                              {data.fullLabel}
                            </span>
                            <span className="font-semibold">{formatCurrency(data.total)}</span>
                          </div>
                          <div className="h-2 bg-muted/50 dark:bg-white/[0.05] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                              className={cn(
                                "h-full rounded-full",
                                isCurrentMonth ? "bg-primary" : "bg-primary/50"
                              )}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Comparison Cards */}
            <div className="grid gap-3 grid-cols-2">
              {biggestIncrease && (
                <FadeIn>
                  <Card className="border-red-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1.5 text-destructive mb-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs font-medium">Biggest Increase</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CategoryIcon
                          icon={biggestIncrease.category.icon}
                          color={biggestIncrease.category.color}
                          size="sm"
                        />
                        <span className="font-medium truncate text-sm">{biggestIncrease.category.name}</span>
                      </div>
                      <p className="text-destructive font-semibold mt-1">
                        +{biggestIncrease.change.toFixed(0)}%
                      </p>
                    </CardContent>
                  </Card>
                </FadeIn>
              )}

              {biggestDecrease && (
                <FadeIn>
                  <Card className="border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1.5 text-primary mb-2">
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-xs font-medium">Biggest Decrease</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CategoryIcon
                          icon={biggestDecrease.category.icon}
                          color={biggestDecrease.category.color}
                          size="sm"
                        />
                        <span className="font-medium truncate text-sm">{biggestDecrease.category.name}</span>
                      </div>
                      <p className="text-primary font-semibold mt-1">
                        {biggestDecrease.change.toFixed(0)}%
                      </p>
                    </CardContent>
                  </Card>
                </FadeIn>
              )}
            </div>

            {/* Month Comparison */}
            <FadeIn>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Month Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-xl bg-muted/30 dark:bg-white/[0.03]">
                      <p className="text-xs text-muted-foreground mb-1">Last Month</p>
                      <p className="text-lg font-bold">{formatCurrency(previousMonthTotal)}</p>
                      <p className="text-xs text-muted-foreground">{format(subMonths(new Date(), 1), 'MMMM')}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-primary/10">
                      <p className="text-xs text-muted-foreground mb-1">This Month</p>
                      <p className="text-lg font-bold">{formatCurrency(currentMonthTotal)}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(), 'MMMM')}</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <div className={cn(
                      "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium",
                      monthChange > 0
                        ? "bg-destructive/10 text-destructive"
                        : monthChange < 0
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                    )}>
                      {monthChange > 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : monthChange < 0 ? (
                        <ArrowDownRight className="h-4 w-4" />
                      ) : (
                        <Minus className="h-4 w-4" />
                      )}
                      {monthChange > 0 ? '+' : ''}{monthChange.toFixed(1)}% change
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4 mt-4">
            {/* Category Pie Representation */}
            <FadeIn>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Spending Breakdown</CardTitle>
                  <CardDescription>{format(new Date(), 'MMMM yyyy')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryBreakdown.length > 0 ? (
                    <>
                      {/* NEW: Donut Chart */}
                      <div className="flex justify-center mb-6">
                        <DonutChart
                          data={categoryBreakdown.slice(0, 6).map(item => ({
                            value: item.total,
                            color: item.category.color,
                            label: item.category.name,
                          }))}
                          size={180}
                          thickness={28}
                          centerContent={
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Total</p>
                              <p className="text-lg font-bold">{formatCurrency(totalCurrentMonth)}</p>
                            </div>
                          }
                        />
                      </div>

                      {/* Visual bar representation */}
                      <div className="flex h-4 rounded-full overflow-hidden mb-4">
                        {categoryBreakdown.map((item, index) => {
                          const percentage = (item.total / totalCurrentMonth) * 100;
                          return (
                            <motion.div
                              key={item.category.id}
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: index * 0.1, duration: 0.5 }}
                              style={{ backgroundColor: item.category.color }}
                              className="first:rounded-l-full last:rounded-r-full"
                            />
                          );
                        })}
                      </div>

                      {/* Category List */}
                      <div className="space-y-3">
                        {categoryBreakdown.map((item, index) => {
                          const percentage = (item.total / totalCurrentMonth) * 100;
                          return (
                            <motion.div
                              key={item.category.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center gap-3"
                            >
                              <CategoryIcon
                                icon={item.category.icon}
                                color={item.category.color}
                                size="md"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium truncate">{item.category.name}</span>
                                  <span className="font-semibold">{formatCurrency(item.total)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{item.count} transactions</span>
                                  <div className="flex items-center gap-2">
                                    <span>{percentage.toFixed(1)}%</span>
                                    {item.prevTotal > 0 && (
                                      <span className={cn(
                                        item.change > 0 ? "text-destructive" : item.change < 0 ? "text-primary" : ""
                                      )}>
                                        {item.change > 0 ? '+' : ''}{item.change.toFixed(0)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground py-8 text-center text-sm">
                      No spending data for this month
                    </div>
                  )}
                </CardContent>
              </Card>
            </FadeIn>

            {/* Category Stats */}
            <FadeIn>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/30 dark:bg-white/[0.03]">
                      <p className="text-xs text-muted-foreground">Categories Used</p>
                      <p className="text-2xl font-bold mt-1">{categoryBreakdown.length}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 dark:bg-white/[0.03]">
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-bold mt-1">{formatCurrency(totalCurrentMonth)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 dark:bg-white/[0.03]">
                      <p className="text-xs text-muted-foreground">Transactions</p>
                      <p className="text-2xl font-bold mt-1">{transactionCount}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 dark:bg-white/[0.03]">
                      <p className="text-xs text-muted-foreground">Avg per Category</p>
                      <p className="text-2xl font-bold mt-1">
                        {categoryBreakdown.length > 0
                          ? formatCurrency(totalCurrentMonth / categoryBreakdown.length)
                          : symbol + '0'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
