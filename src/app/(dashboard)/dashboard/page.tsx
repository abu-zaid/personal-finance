'use client';

import { useMemo, useState, useEffect } from 'react';
import { format, subDays, startOfDay, isSameDay, subMonths, getDaysInMonth } from 'date-fns';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PageTransition, StaggerContainer, StaggerItem, FadeIn } from '@/components/animations';
import { useAuth } from '@/context/auth-context';
import { useCategories } from '@/context/categories-context';
import { useTransactions } from '@/context/transactions-context';
import { useBudgets } from '@/context/budgets-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryIcon } from '@/components/features/categories';
import { DashboardSkeleton } from '@/components/shared';
import {
  BalanceCard,
  BudgetOverview,
  RecentTransactions,
  SpendingByCategory,
} from '@/components/features/dashboard';
import { Sparkline, SpendingVelocityGauge } from '@/components/charts';
import { getMonthString, cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ArrowRight,
  Zap,
  Target,
  PiggyBank,
  Sparkles,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Gauge
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { transactions, isLoading: transactionsLoading, getMonthlyTotal, getMonthlyIncome, getMonthlyExpenses } = useTransactions();
  const { getBudgetByMonth, isLoading: budgetsLoading } = useBudgets();
  const { formatCurrency } = useCurrency();

  // Combined loading state - show skeleton until all data is ready
  const isDataLoading = categoriesLoading || transactionsLoading || budgetsLoading;

  const currentMonth = getMonthString(new Date());
  const previousMonth = getMonthString(subMonths(new Date(), 1));

  // Get current month budget
  const currentMonthBudget = getBudgetByMonth(currentMonth);

  // State for interactive 7-day chart
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  // Calculate spending by category for current month (expenses only)
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const transactionMonth = getMonthString(new Date(t.date));
      return transactionMonth === currentMonth && t.type === 'expense';
    });
  }, [transactions, currentMonth]);

  const spendingByCategory = useMemo(() => {
    return categories.map((category) => {
      const categoryTransactions = currentMonthTransactions.filter(
        (t) => t.categoryId === category.id
      );
      const amount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      return { categoryId: category.id, amount };
    });
  }, [categories, currentMonthTransactions]);

  // Filter for display (only categories with spending)
  const spendingByCategoryFiltered = useMemo(() => {
    return spendingByCategory.filter((item) => item.amount > 0);
  }, [spendingByCategory]);

  // Calculate totals
  const totalBudget = currentMonthBudget?.totalAmount ?? 0;
  const totalSpent = getMonthlyExpenses(currentMonth);
  const totalIncome = getMonthlyIncome(currentMonth);
  const previousMonthSpent = getMonthlyExpenses(previousMonth);
  const budgetRemaining = totalBudget - totalSpent;
  const budgetUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const hasBudget = totalBudget > 0;
  const netBalance = totalIncome - totalSpent;

  // Month-over-month change
  const monthChange = previousMonthSpent > 0
    ? ((totalSpent - previousMonthSpent) / previousMonthSpent) * 100
    : 0;

  // Last 7 days spending (expenses only)
  const last7DaysSpending = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dayTransactions = transactions.filter((t) =>
        isSameDay(new Date(t.date), date) && t.type === 'expense'
      );
      const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
      days.push({
        date,
        label: format(date, 'EEE'),
        total,
        isToday: i === 0,
      });
    }
    return days;
  }, [transactions]);

  const maxDailySpend = Math.max(...last7DaysSpending.map((d) => d.total), 1);
  const todaySpent = last7DaysSpending[6]?.total ?? 0;

  // Top spending category
  const topCategory = useMemo(() => {
    if (spendingByCategoryFiltered.length === 0) return null;
    const sorted = [...spendingByCategoryFiltered].sort((a, b) => b.amount - a.amount);
    const topItem = sorted[0];
    const category = categories.find((c) => c.id === topItem.categoryId);
    return category ? { category, amount: topItem.amount } : null;
  }, [spendingByCategoryFiltered, categories]);

  // Smart insight based on spending patterns
  const insight = useMemo(() => {
    if (budgetUsage >= 90) {
      return {
        type: 'warning' as const,
        icon: Target,
        title: 'Budget Alert',
        message: `You've used ${budgetUsage.toFixed(0)}% of your budget. Consider slowing down spending.`,
      };
    }
    if (monthChange > 20) {
      return {
        type: 'warning' as const,
        icon: TrendingUp,
        title: 'Spending Up',
        message: `You're spending ${monthChange.toFixed(0)}% more than last month.`,
      };
    }
    if (monthChange < -10) {
      return {
        type: 'success' as const,
        icon: Sparkles,
        title: 'Great Progress!',
        message: `You're spending ${Math.abs(monthChange).toFixed(0)}% less than last month. Keep it up!`,
      };
    }
    if (topCategory && totalSpent > 0) {
      const percentage = ((topCategory.amount / totalSpent) * 100).toFixed(0);
      return {
        type: 'info' as const,
        icon: Lightbulb,
        title: 'Top Category',
        message: `${topCategory.category.name} makes up ${percentage}% of your spending this month.`,
      };
    }
    return {
      type: 'info' as const,
      icon: PiggyBank,
      title: 'Stay on Track',
      message: 'Log your expenses daily to build better financial habits.',
    };
  }, [budgetUsage, monthChange, topCategory, totalSpent]);

  // NEW: Additional calculations for enhanced visualizations

  // Days in current month and elapsed days
  const daysInMonth = getDaysInMonth(new Date());
  const daysElapsed = new Date().getDate();

  // Income vs Expenses breakdown
  const incomeVsExpenses = useMemo(() => {
    return {
      income: totalIncome,
      expenses: totalSpent,
      savings: totalIncome - totalSpent,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0,
    };
  }, [totalIncome, totalSpent]);

  // Category trends (last 7 days for top 5 categories)
  const categoryTrends = useMemo(() => {
    const topCategories = [...spendingByCategoryFiltered]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return topCategories.map(({ categoryId }) => {
      const category = categories.find(c => c.id === categoryId);
      const last7Days = [];

      for (let i = 6; i >= 0; i--) {
        const date = startOfDay(subDays(new Date(), i));
        const dayTotal = transactions
          .filter(t =>
            t.categoryId === categoryId &&
            isSameDay(new Date(t.date), date) &&
            t.type === 'expense'
          )
          .reduce((sum, t) => sum + t.amount, 0);
        last7Days.push(dayTotal);
      }

      return {
        category,
        data: last7Days,
        total: last7Days.reduce((sum, val) => sum + val, 0),
      };
    });
  }, [spendingByCategoryFiltered, categories, transactions]);

  // Top 3 spending days this month
  const topSpendingDays = useMemo(() => {
    const dailyTotals = new Map<string, number>();

    currentMonthTransactions.forEach(t => {
      const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
      dailyTotals.set(dateKey, (dailyTotals.get(dateKey) || 0) + t.amount);
    });

    return Array.from(dailyTotals.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [currentMonthTransactions]);

  const maxTopDaySpend = topSpendingDays[0]?.amount || 1;

  // Get greeting based on time of day - using state to ensure client-side rendering
  const [greeting, setGreeting] = useState('Hello');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 17) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  // Show skeleton while data is loading
  if (isDataLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Welcome Message - Mobile */}
        <div className="lg:hidden flex items-start justify-between">
          <div>
            <p className="text-muted-foreground/60 text-[11px] font-medium uppercase tracking-wide">{greeting},</p>
            <h1 className="text-xl font-semibold text-foreground mt-0.5">
              {user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
          </div>
          <Link href="/transactions">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg cursor-pointer"
              style={{
                background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
                boxShadow: '0 0 12px rgba(152, 239, 90, 0.25)',
              }}
            >
              <Plus className="h-4 w-4 text-[#101010]" />
            </div>
          </Link>
        </div>

        {/* Desktop Welcome */}
        <div className="hidden lg:flex lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {greeting}, {user?.name?.split(' ')[0] || 'there'}!
            </h2>
            <p className="text-muted-foreground/70 mt-1">
              Here&apos;s what&apos;s happening with your finances this month.
            </p>
          </div>
          <Link href="/transactions">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-[#101010] shadow-lg transition-transform hover:scale-105"
              style={{
                background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
                boxShadow: '0 4px 16px rgba(152, 239, 90, 0.3)',
              }}
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          </Link>
        </div>

        {/* Hero Balance Card */}
        <StaggerContainer>
          <StaggerItem>
            <BalanceCard
              balance={budgetRemaining}
              income={totalBudget}
              expenses={totalSpent}
              transactionCount={currentMonthTransactions.length}
              budgetUsage={budgetUsage}
            />
          </StaggerItem>
        </StaggerContainer>

        {/* Quick Insight Banner - Refined */}
        <FadeIn>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "relative overflow-hidden rounded-xl p-3 border-none flex items-center gap-3",
              {
                'bg-amber-500/10 text-amber-600 dark:text-amber-400': insight.type === 'warning',
                'bg-primary/10 text-primary-600 dark:text-primary-400': insight.type === 'success',
                'bg-blue-500/10 text-blue-600 dark:text-blue-400': insight.type === 'info',
              }
            )}
          >
            <div className={cn(
              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
              {
                'bg-amber-500/20 text-amber-600': insight.type === 'warning',
                'bg-primary/20 text-primary': insight.type === 'success',
                'bg-blue-500/20 text-blue-500': insight.type === 'info',
              }
            )}>
              <insight.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] md:text-xs font-bold leading-tight uppercase tracking-wider opacity-80 mb-0.5">{insight.title}</p>
              <p className="text-xs md:text-sm font-medium leading-tight truncate">{insight.message}</p>
            </div>
          </motion.div>
        </FadeIn>

        {/* 7-Day Spending Chart */}
        <FadeIn>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Last 7 Days</CardTitle>
                <div className="flex items-center gap-2">
                  {monthChange !== 0 && (
                    <span className={cn(
                      "flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
                      monthChange > 0
                        ? "bg-red-500/10 text-red-500"
                        : "bg-primary/10 text-primary"
                    )}>
                      {monthChange > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-0.5" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-0.5" />
                      )}
                      {monthChange > 0 ? '+' : ''}{monthChange.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-1.5 h-20">
                {last7DaysSpending.map((day, index) => {
                  const isHovered = hoveredDayIndex === index;

                  return (
                    <motion.div
                      key={day.label}
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="flex-1 flex flex-col items-center gap-1 relative group"
                      style={{ originY: 1 }}
                      onMouseEnter={() => setHoveredDayIndex(index)}
                      onMouseLeave={() => setHoveredDayIndex(null)}
                    >
                      <motion.div
                        className={cn(
                          "w-full rounded-t-md transition-all cursor-pointer relative overflow-hidden",
                          day.isToday ? "bg-primary" : "bg-primary/30 dark:bg-primary/40"
                        )}
                        style={{
                          height: day.total > 0 ? `${Math.max((day.total / maxDailySpend) * 56, 4)}px` : '4px',
                        }}
                        animate={{
                          scale: isHovered ? 1.1 : 1,
                          filter: isHovered ? 'drop-shadow(0 0 8px rgba(152, 239, 90, 0.5))' : 'none',
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Shimmer effect on hover */}
                        {isHovered && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </motion.div>

                      {/* Tooltip */}
                      {isHovered && day.total > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute bottom-full mb-2 px-2 py-1 rounded-lg glass-card text-[10px] font-semibold whitespace-nowrap z-10"
                        >
                          {formatCurrency(day.total)}
                        </motion.div>
                      )}

                      <span className={cn(
                        "text-[10px] font-medium transition-colors",
                        day.isToday ? "text-primary" : "text-muted-foreground",
                        isHovered && "text-primary font-semibold"
                      )}>
                        {day.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Today</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(todaySpent)}
                </span>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FadeIn>
            <Card className="h-full border-none shadow-sm bg-muted/20">
              <CardContent className="p-4 flex flex-col justify-center h-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-primary/20">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Daily Avg</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(currentMonthTransactions.length > 0
                    ? totalSpent / new Date().getDate()
                    : 0
                  )}
                </p>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn>
            <Card className="h-full border-none shadow-sm bg-muted/20">
              <CardContent className="p-4 flex flex-col justify-center h-full">
                <div className="flex items-center gap-2 mb-2">
                  {topCategory ? (
                    <CategoryIcon
                      icon={topCategory.category.icon}
                      color={topCategory.category.color}
                      size="sm"
                    />
                  ) : (
                    <div className="p-1.5 rounded-lg bg-muted">
                      <PiggyBank className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider truncate">
                    {topCategory?.category.name || 'Top Spend'}
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {topCategory ? formatCurrency(topCategory.amount) : '-'}
                </p>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Spending by Category */}
        <StaggerItem>
          <SpendingByCategory
            spending={spendingByCategoryFiltered}
            categories={categories}
            totalSpent={totalSpent}
          />
        </StaggerItem>

        {/* Budget Overview */}
        <StaggerItem>
          <BudgetOverview
            budget={currentMonthBudget}
            categories={categories}
            spendingByCategory={spendingByCategory}
          />
        </StaggerItem>

        {/* Recent Transactions */}
        <StaggerItem>
          <RecentTransactions
            transactions={currentMonthTransactions}
            categories={categories}
            limit={5}
          />
        </StaggerItem>
      </div>
    </PageTransition>
  );
}
