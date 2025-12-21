'use client';

import { useMemo, useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem, AnimatedNumber } from '@/components/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared';
import { CategoryIcon } from '@/components/features/categories';
import { SmartInsights } from '@/components/features/dashboard/smart-insights';
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
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Activity,
  Zap,
  Award,
  AlertCircle,
} from 'lucide-react';
import { DonutChart, LineChart, BarChart, SpendingVelocityGauge } from '@/components/charts';

export default function InsightsPage() {
  const { transactions, getMonthlyTotal, getMonthlyExpenses } = useTransactions();
  const { categories } = useCategories();
  const { getBudgetByMonth } = useBudgets();
  const { formatCurrency } = useCurrency();

  const [activeTab, setActiveTab] = useState('overview');
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

  const currentMonthTotal = getMonthlyExpenses(currentMonth);
  const previousMonthTotal = getMonthlyExpenses(previousMonth);

  // Budget data
  const currentBudget = getBudgetByMonth(currentMonth);
  const budgetUsage = currentBudget ? (currentMonthTotal / currentBudget.totalAmount) * 100 : 0;
  const budgetRemaining = currentBudget ? currentBudget.totalAmount - currentMonthTotal : 0;

  // Month-over-month change
  const monthChange = previousMonthTotal > 0
    ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
    : 0;

  // Last 6 months trend data for line chart
  const monthlyTrendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const month = getMonthString(date);
      months.push({
        label: format(date, 'MMM'),
        value: getMonthlyExpenses(month),
      });
    }
    return months;
  }, [getMonthlyExpenses]);

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
        value: total,
      };
    });
  }, [currentMonthTransactions]);

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
            {format(new Date(), 'MMMM yyyy')} financial analysis
          </p>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Financial Health Score */}
            <FadeIn>
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Financial Health Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-muted/20"
                        />
                        <motion.circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke={healthScore >= 80 ? '#98EF5A' : healthScore >= 60 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          initial={{ strokeDasharray: '0 251.2' }}
                          animate={{ strokeDasharray: `${(healthScore / 100) * 251.2} 251.2` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{Math.round(healthScore)}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        "text-lg font-bold mb-1",
                        healthScore >= 80 ? "text-primary" : healthScore >= 60 ? "text-yellow-500" : "text-destructive"
                      )}>
                        {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs Attention'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {healthScore >= 80
                          ? 'Your spending is well-managed and within budget.'
                          : healthScore >= 60
                            ? 'Your spending is mostly on track with some areas to improve.'
                            : 'Consider reviewing your budget and spending habits.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Key Metrics */}
            <StaggerContainer>
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
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
                        {currentMonthTransactions.length} transactions
                      </p>
                    </CardContent>
                  </Card>
                </StaggerItem>

                <StaggerItem>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-purple-500/10">
                          <Activity className="h-4 w-4 text-purple-500" />
                        </div>
                        <span className="text-xs text-muted-foreground">Projected</span>
                      </div>
                      <div className="text-lg sm:text-xl font-bold">
                        <AnimatedNumber value={projectedTotal} format="currency" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        by month end
                      </p>
                    </CardContent>
                  </Card>
                </StaggerItem>

                <StaggerItem>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-orange-500/10">
                          <Target className="h-4 w-4 text-orange-500" />
                        </div>
                        <span className="text-xs text-muted-foreground">Categories</span>
                      </div>
                      <div className="text-lg sm:text-xl font-bold">
                        {categoryBreakdown.length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        active this month
                      </p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              </div>
            </StaggerContainer>

            {/* Spending Velocity */}
            {currentBudget && (
              <FadeIn>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Spending Velocity
                    </CardTitle>
                    <CardDescription>
                      Your current spending pace vs recommended
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SpendingVelocityGauge
                      currentSpending={currentMonthTotal}
                      budget={currentBudget.totalAmount}
                      daysElapsed={daysElapsed}
                      daysInMonth={daysInMonth}
                    />
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="text-center p-3 rounded-xl bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Current Rate</p>
                        <p className="text-base font-bold">{formatCurrency(Math.round(dailyAverage))}/day</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-primary/10">
                        <p className="text-xs text-muted-foreground mb-1">Target Rate</p>
                        <p className="text-base font-bold">{formatCurrency(Math.round(recommendedDailySpend))}/day</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {/* Smart Insights */}
            <FadeIn>
              <SmartInsights />
            </FadeIn>

            {/* Top Category */}
            {categoryBreakdown[0] && (
              <FadeIn>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Top Spending Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <CategoryIcon
                        icon={categoryBreakdown[0].category.icon}
                        color={categoryBreakdown[0].category.color}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{categoryBreakdown[0].category.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {categoryBreakdown[0].count} transactions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-base sm:text-lg">{formatCurrency(categoryBreakdown[0].total)}</p>
                        <p className="text-xs text-muted-foreground">
                          {((categoryBreakdown[0].total / totalCurrentMonth) * 100).toFixed(0)}% of total
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            )}
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4 mt-4">
            {/* 6 Month Spending Trend */}
            <FadeIn>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">6 Month Spending Trend</CardTitle>
                  <CardDescription>Track your spending over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <LineChart
                    series={[{
                      name: 'Total Spending',
                      data: monthlyTrendData,
                      color: '#98EF5A',
                    }]}
                    height={200}
                    formatValue={formatCurrency}
                  />
                </CardContent>
              </Card>
            </FadeIn>

            {/* Daily Spending This Month */}
            <FadeIn>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Daily Spending - {format(new Date(), 'MMMM')}</CardTitle>
                  <CardDescription>Day-by-day breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto -mx-2 px-2">
                    <div style={{ minWidth: `${Math.max(dailySpendingData.length * 20, 300)}px` }}>
                      <BarChart
                        data={dailySpendingData.map(d => ({
                          label: d.label,
                          value: d.value,
                          color: '#98EF5A',
                        }))}
                        height={180}
                        formatValue={formatCurrency}
                        showValues={false}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Comparison Cards */}
            <div className="grid gap-3 grid-cols-2">
              <FadeIn>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-medium">Last Month</span>
                    </div>
                    <p className="text-xl font-bold">{formatCurrency(previousMonthTotal)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(subMonths(new Date(), 1), 'MMMM')}
                    </p>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn>
                <Card className="border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 text-primary mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-medium">This Month</span>
                    </div>
                    <p className="text-xl font-bold">{formatCurrency(currentMonthTotal)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(), 'MMMM')}
                    </p>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-4 mt-4">
            {currentBudget ? (
              <>
                {/* Budget Overview */}
                <FadeIn>
                  <Card>
                    <CardHeader className="pb-3">
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

                {/* Category Budget Comparison */}
                {categoryBudgetComparison.length > 0 && (
                  <FadeIn>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Budget vs Actual by Category</CardTitle>
                        <CardDescription>How you're tracking against your budget</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {categoryBudgetComparison.map((item, index) => (
                            <motion.div
                              key={item.category.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="space-y-2"
                            >
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <CategoryIcon
                                    icon={item.category.icon}
                                    color={item.category.color}
                                    size="sm"
                                  />
                                  <span className="font-medium">{item.category.name}</span>
                                </div>
                                <span className={cn(
                                  "font-semibold",
                                  item.usage >= 100 ? "text-destructive" : item.usage >= 80 ? "text-yellow-500" : "text-foreground"
                                )}>
                                  {item.usage.toFixed(0)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(item.usage, 100)}%` }}
                                    transition={{ duration: 0.6, delay: index * 0.05 + 0.2 }}
                                    className="h-full rounded-full"
                                    style={{
                                      backgroundColor: item.usage >= 100 ? '#ef4444' : item.usage >= 80 ? '#f59e0b' : item.category.color,
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{formatCurrency(item.total)} spent</span>
                                <span>{formatCurrency(item.budgetAmount)} budgeted</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </FadeIn>
                )}

                {/* Projection Alert */}
                {projectedTotal > currentBudget.totalAmount && (
                  <FadeIn>
                    <Card className="border-destructive/50 bg-destructive/5">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-sm mb-1">Budget Projection Alert</p>
                            <p className="text-sm text-muted-foreground">
                              At your current spending rate, you're projected to spend{' '}
                              <span className="font-semibold text-destructive">{formatCurrency(projectedTotal)}</span>
                              {' '}this month, exceeding your budget by{' '}
                              <span className="font-semibold text-destructive">
                                {formatCurrency(projectedTotal - currentBudget.totalAmount)}
                              </span>.
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Reduce daily spending to{' '}
                              <span className="font-semibold text-foreground">{formatCurrency(Math.round(recommendedDailySpend))}/day</span>
                              {' '}to stay within budget.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </FadeIn>
                )}
              </>
            ) : (
              <Card>
                <EmptyState
                  icon={<PiggyBank className="h-10 w-10" />}
                  title="No budget set"
                  description="Create a budget to track your spending and get insights."
                />
              </Card>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4 mt-4">
            {/* Category Breakdown with Donut Chart */}
            <FadeIn>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Spending Breakdown</CardTitle>
                  <CardDescription>{format(new Date(), 'MMMM yyyy')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryBreakdown.length > 0 ? (
                    <>
                      <div className="flex justify-center mb-6">
                        <DonutChart
                          data={categoryBreakdown.slice(0, 6).map(item => ({
                            value: item.total,
                            color: item.category.color,
                            label: item.category.name,
                          }))}
                          size={200}
                          thickness={32}
                          centerContent={
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Total</p>
                              <p className="text-lg font-bold">{formatCurrency(totalCurrentMonth)}</p>
                            </div>
                          }
                          onSegmentClick={(segment, index) => {
                            const category = categoryBreakdown[index];
                            setSelectedCategory(category.category.id);
                            setActiveTab('categories');
                          }}
                        />
                      </div>

                      {/* Category List */}
                      <div className="space-y-3">
                        {categoryBreakdown.map((item, index) => (
                          <motion.button
                            key={item.category.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-muted/50",
                              selectedCategory === item.category.id && "bg-muted/50 ring-2 ring-primary/20"
                            )}
                            onClick={() => setSelectedCategory(
                              selectedCategory === item.category.id ? null : item.category.id
                            )}
                          >
                            <CategoryIcon
                              icon={item.category.icon}
                              color={item.category.color}
                              size="md"
                            />
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center justify-between">
                                <span className="font-medium truncate">{item.category.name}</span>
                                <span className="font-semibold">{formatCurrency(item.total)}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{item.count} transactions</span>
                                <div className="flex items-center gap-2">
                                  <span>{((item.total / totalCurrentMonth) * 100).toFixed(1)}%</span>
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
                          </motion.button>
                        ))}
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

            {/* Category Trend (when selected) */}
            {selectedCategory && categoryTrendData.length > 0 && (
              <FadeIn key={`category-trend-${selectedCategory}`}>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">
                        {categoryTrendData[0].name} - 6 Month Trend
                      </CardTitle>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    <CardDescription>Spending over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {categoryTrendData[0].data.some(d => d.value > 0) ? (
                      <LineChart
                        series={categoryTrendData}
                        height={180}
                        formatValue={formatCurrency}
                        showGrid={true}
                        showDots={true}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                        No spending data for this category in the last 6 months
                      </div>
                    )}
                  </CardContent>
                </Card>
              </FadeIn>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
