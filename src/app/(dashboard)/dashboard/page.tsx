'use client';

import { useMemo, useState } from 'react';
import { format, subDays, startOfDay, isSameDay, subMonths, getDaysInMonth } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Zap,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Activity,
  BarChart3,
  Wallet,
  PieChart,
  DollarSign,
} from 'lucide-react';

import { PageTransition, FadeIn, AnimatedNumber } from '@/components/animations';
import { useAuth } from '@/context/auth-context';
import { useCategories } from '@/context/categories-context';
import { useTransactions } from '@/context/transactions-context';
import { useBudgets } from '@/context/budgets-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryIcon } from '@/components/features/categories';
import { DashboardSkeleton } from '@/components/shared';
import { useSmartInsights } from '@/hooks/use-smart-insights';
import { getMonthString, cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

export default function DashboardPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { transactions, isLoading: transactionsLoading, getMonthlyIncome, getMonthlyExpenses } = useTransactions();
  const { getBudgetByMonth, isLoading: budgetsLoading } = useBudgets();
  const { formatCurrency, symbol } = useCurrency();
  const insights = useSmartInsights();

  const isDataLoading = categoriesLoading || transactionsLoading || budgetsLoading;

  const currentMonth = getMonthString(currentDate);
  const previousMonth = getMonthString(subMonths(currentDate, 1));
  const selectedMonth = format(currentDate, 'MMMM');
  const currentMonthBudget = getBudgetByMonth(currentMonth);

  // Calculate key metrics
  const totalIncome = getMonthlyIncome(currentMonth);
  const totalExpenses = getMonthlyExpenses(currentMonth);
  const totalBudget = currentMonthBudget?.totalAmount ?? 0;
  const budgetRemaining = totalBudget - totalExpenses;
  const budgetUsage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

  const previousMonthExpenses = getMonthlyExpenses(previousMonth);
  const monthOverMonthChange = previousMonthExpenses > 0
    ? ((totalExpenses - previousMonthExpenses) / previousMonthExpenses) * 100
    : 0;

  const daysInMonth = getDaysInMonth(new Date());
  const daysElapsed = new Date().getDate();
  const daysRemaining = daysInMonth - daysElapsed;

  // Current month transactions
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const transactionMonth = getMonthString(new Date(t.date));
      return transactionMonth === currentMonth && t.type === 'expense';
    });
  }, [transactions, currentMonth]);

  // Cumulative spending trend for current month
  const spendingTrendData = useMemo(() => {
    const days = [];
    let cumulativeSpending = 0;
    const dailyBudget = totalBudget > 0 ? totalBudget / daysInMonth : 0;

    for (let i = 1; i <= daysElapsed; i++) {
      const date = new Date(new Date().getFullYear(), new Date().getMonth(), i);
      const dateStr = format(date, 'd');

      const dayExpenses = currentMonthTransactions
        .filter(t => {
          const tDate = new Date(t.date);
          return tDate.getDate() === i;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      cumulativeSpending += dayExpenses;
      const budgetPace = dailyBudget * i;

      days.push({
        date: dateStr,
        spending: cumulativeSpending,
        budgetPace: budgetPace,
        dailySpend: dayExpenses,
      });
    }
    return days;
  }, [currentMonthTransactions, totalBudget, daysInMonth, daysElapsed]);

  // Top spending categories
  const topCategories = useMemo(() => {
    const categoryTotals = categories.map(cat => {
      const amount = currentMonthTransactions
        .filter(t => t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);

      const budgetAllocation = currentMonthBudget?.allocations.find(
        (a: { categoryId: string }) => a.categoryId === cat.id
      );

      return {
        category: cat,
        amount,
        budget: budgetAllocation?.amount ?? 0,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      };
    })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return categoryTotals;
  }, [categories, currentMonthTransactions, totalExpenses, currentMonthBudget]);

  // Budget health by category
  const budgetHealth = useMemo(() => {
    if (!currentMonthBudget) return [];

    return currentMonthBudget.allocations.map((allocation: { categoryId: string; amount: number }) => {
      const category = categories.find(c => c.id === allocation.categoryId);
      if (!category) return null;

      const spent = currentMonthTransactions
        .filter(t => t.categoryId === allocation.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);

      const remaining = allocation.amount - spent;
      const usage = allocation.amount > 0 ? (spent / allocation.amount) * 100 : 0;

      let status: 'safe' | 'warning' | 'danger' = 'safe';
      if (usage >= 100) status = 'danger';
      else if (usage >= 80) status = 'warning';

      return {
        category,
        allocated: allocation.amount,
        spent,
        remaining,
        usage,
        status,
      };
    }).filter(Boolean);
  }, [currentMonthBudget, categories, currentMonthTransactions]);

  if (isDataLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <PageTransition>
      <div className="space-y-4 md:space-y-6 px-4 md:px-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Welcome, {user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
              {format(new Date(), 'MMMM yyyy')}
            </p>
          </div>
          <Link href="/transactions">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl font-semibold text-[#101010] shadow-lg text-sm md:text-base"
              style={{
                background: 'linear-gradient(135deg, #98EF5A 0%, #7BEA3C 100%)',
                boxShadow: '0 8px 24px rgba(152, 239, 90, 0.35)',
              }}
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5" strokeWidth={2.5} />
              <span className="hidden sm:inline">Add</span>
            </motion.button>
          </Link>
        </div>

        {/* Hero - Budget Overview */}
        <FadeIn>
          <Card className="border-border/40 shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
            <CardContent className="p-4 md:p-6 relative">
              <div className="space-y-4 md:space-y-6">
                {/* Main Budget Display */}
                <div>
                  <p className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1 md:mb-2">
                    {totalBudget > 0 ? 'Budget Remaining' : 'Total Spent This Month'}
                  </p>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={cn(
                      "text-2xl md:text-4xl font-bold tabular-nums",
                      totalBudget > 0
                        ? (budgetRemaining >= 0 ? "text-green-500" : "text-destructive")
                        : "text-foreground"
                    )}>
                      {symbol}<AnimatedNumber value={totalBudget > 0 ? Math.abs(budgetRemaining) : totalExpenses} />
                    </span>
                    {totalBudget > 0 && budgetUsage > 0 && (
                      <Badge variant="outline" className={cn(
                        "text-[10px] md:text-xs",
                        budgetUsage >= 100 ? "bg-red-500/10 text-red-600 border-red-500/20" :
                          budgetUsage >= 80 ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                            "bg-green-500/10 text-green-600 border-green-500/20"
                      )}>
                        <AnimatedNumber value={budgetUsage} />% used
                      </Badge>
                    )}
                  </div>

                  {/* Budget Progress Bar */}
                  {totalBudget > 0 && (
                    <div className="mt-3 md:mt-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Progress
                          value={Math.min(budgetUsage, 100)}
                          className="h-2 md:h-3"
                        />
                      </motion.div>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                      <Wallet className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                      <span className="text-[10px] md:text-xs text-muted-foreground font-medium">Budget</span>
                    </div>
                    <p className="text-sm md:text-2xl font-bold tabular-nums">
                      {symbol}<AnimatedNumber value={totalBudget} />
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                      <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-destructive" />
                      <span className="text-[10px] md:text-xs text-muted-foreground font-medium">Spent</span>
                    </div>
                    <p className="text-sm md:text-2xl font-bold text-destructive tabular-nums">
                      {symbol}<AnimatedNumber value={totalExpenses} />
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                      <Calendar className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                      <span className="text-[10px] md:text-xs text-muted-foreground font-medium">Days Left</span>
                    </div>
                    <p className="text-sm md:text-2xl font-bold tabular-nums">
                      <AnimatedNumber value={daysRemaining} />
                    </p>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Mobile: Tabs for Charts */}
        <div className="lg:hidden">
          <Tabs defaultValue="flow" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="flow" className="text-xs py-2">
                <Activity className="h-3 w-3 mr-1" />
                Cash Flow
              </TabsTrigger>
              <TabsTrigger value="categories" className="text-xs py-2">
                <BarChart3 className="h-3 w-3 mr-1" />
                Categories
              </TabsTrigger>
            </TabsList>

            {/* Spending Trend */}
            <TabsContent value="flow" className="mt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key="flow"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-border/40 shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm md:text-base">Spending Trend</CardTitle>
                          <CardDescription className="text-xs">Cumulative spending this month</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          MTD
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4 max-w-full overflow-hidden">
                      {spendingTrendData.length > 0 ? (
                        <>
                          <div className="w-full overflow-hidden min-w-0">
                            <ChartContainer
                              config={{
                                spending: {
                                  label: "Spending",
                                  color: "var(--destructive)",
                                },
                                budgetPace: {
                                  label: "Budget Pace",
                                  color: "var(--chart-2)",
                                },
                              } satisfies ChartConfig}
                              className="h-[200px] w-full [&>div]:!aspect-auto"
                            >
                              <AreaChart data={spendingTrendData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-spending)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--color-spending)" stopOpacity={0.05} />
                                  </linearGradient>
                                  <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-budgetPace)" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="var(--color-budgetPace)" stopOpacity={0.05} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                  dataKey="date"
                                  tickLine={false}
                                  axisLine={false}
                                  tickMargin={8}
                                  interval={Math.floor(spendingTrendData.length / 6)}
                                />
                                <YAxis
                                  tickLine={false}
                                  axisLine={false}
                                  tickMargin={8}
                                  width={45}
                                  tickFormatter={(value) => `${symbol}${value}`}
                                />
                                <ChartTooltip
                                  content={
                                    <ChartTooltipContent
                                      labelFormatter={(label) => `Day ${label}`}
                                      formatter={(value) => formatCurrency(Number(value))}
                                    />
                                  }
                                />
                                {totalBudget > 0 && (
                                  <Area
                                    type="monotone"
                                    dataKey="budgetPace"
                                    stroke="var(--color-budgetPace)"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    fill="url(#budgetGradient)"
                                    dot={false}
                                  />
                                )}
                                <Area
                                  type="monotone"
                                  dataKey="spending"
                                  stroke="var(--color-spending)"
                                  strokeWidth={2.5}
                                  fill="url(#spendingGradient)"
                                  dot={false}
                                  activeDot={{ r: 4 }}
                                />
                              </AreaChart>
                            </ChartContainer>
                          </div>

                          {/* Summary Stats */}
                          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/50">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingDown className="h-3 w-3 text-destructive" />
                                <span className="text-[10px] text-muted-foreground">Spent</span>
                              </div>
                              <p className="text-xs font-bold text-destructive tabular-nums">
                                {symbol}<AnimatedNumber value={totalExpenses} />
                              </p>
                            </div>
                            {totalBudget > 0 && (
                              <>
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <Target className="h-3 w-3 text-green-500" />
                                    <span className="text-[10px] text-muted-foreground">Budget</span>
                                  </div>
                                  <p className="text-xs font-bold text-green-500 tabular-nums">
                                    {symbol}<AnimatedNumber value={totalBudget} />
                                  </p>
                                </div>
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <DollarSign className="h-3 w-3 text-primary" />
                                    <span className="text-[10px] text-muted-foreground">Left</span>
                                  </div>
                                  <p className={cn(
                                    "text-xs font-bold tabular-nums",
                                    budgetRemaining >= 0 ? "text-green-500" : "text-destructive"
                                  )}>
                                    {symbol}<AnimatedNumber value={Math.abs(budgetRemaining)} />
                                  </p>
                                </div>
                              </>
                            )}
                            {totalBudget === 0 && (
                              <div className="col-span-2 text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Calendar className="h-3 w-3 text-primary" />
                                  <span className="text-[10px] text-muted-foreground">Avg/Day</span>
                                </div>
                                <p className="text-xs font-bold tabular-nums">
                                  {symbol}<AnimatedNumber value={daysElapsed > 0 ? totalExpenses / daysElapsed : 0} />
                                </p>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="p-3 mb-2 rounded-full bg-muted/50">
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">No spending data</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* Categories */}
            <TabsContent value="categories" className="mt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key="categories"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-border/40 shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm md:text-base">Top Categories</CardTitle>
                          <CardDescription className="text-xs">Highest spending areas</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {selectedMonth}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="space-y-4">
                        {topCategories.length > 0 ? (
                          topCategories.map((item) => (
                            <div key={item.category.id} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{item.category.icon}</span>
                                  <span className="font-medium">{item.category.name}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold tabular-nums">{formatCurrency(item.amount)}</span>
                                  <span className="text-[10px] text-muted-foreground ml-1">
                                    ({Math.round((item.amount / totalExpenses) * 100)}%)
                                  </span>
                                </div>
                              </div>
                              <Progress
                                value={(item.amount / totalExpenses) * 100}
                                className="h-1.5"
                                indicatorClassName="bg-primary/80"
                              />
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6 text-center">
                            <div className="p-3 mb-2 rounded-full bg-muted/50">
                              <Target className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">No category data</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cash Flow Chart */}
            <FadeIn>
              <Card className="border-border/40 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Cash Flow Trend
                  </CardTitle>
                  <CardDescription>
                    Last 30 days income vs expenses
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-w-full overflow-hidden">
                  <div className="w-full overflow-hidden min-w-0">
                    <ChartContainer
                      config={{
                        spending: {
                          label: "Spending",
                          color: "var(--destructive)",
                        },
                        budgetPace: {
                          label: "Budget Pace",
                          color: "var(--chart-2)",
                        },
                      } satisfies ChartConfig}
                      className="h-[250px] w-full [&>div]:!aspect-auto"
                    >
                      <AreaChart data={spendingTrendData}>
                        <defs>
                          <linearGradient id="desktopSpendingGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-spending)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--color-spending)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="desktopBudgetGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-budgetPace)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="var(--color-budgetPace)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={50}
                          tickFormatter={(value) => `${symbol}${value}`}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              labelFormatter={(label) => `Day ${label}`}
                              formatter={(value) => formatCurrency(Number(value))}
                            />
                          }
                        />
                        {totalBudget > 0 && (
                          <Area
                            type="monotone"
                            dataKey="budgetPace"
                            stroke="var(--color-budgetPace)"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            fill="url(#desktopBudgetGradient)"
                          />
                        )}
                        <Area
                          type="monotone"
                          dataKey="spending"
                          stroke="var(--color-spending)"
                          strokeWidth={2}
                          fill="url(#desktopSpendingGradient)"
                        />
                      </AreaChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Top Categories */}
            <FadeIn>
              <Card className="border-border/40 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Top Spending Categories
                  </CardTitle>
                  <CardDescription>
                    Where your money is going this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topCategories.map((item, index) => (
                      <motion.div
                        key={item.category.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="p-2 rounded-xl"
                              style={{ backgroundColor: `${item.category.color}20` }}
                            >
                              <CategoryIcon
                                icon={item.category.icon}
                                color={item.category.color}
                                size="sm"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{item.category.name}</p>
                              <p className="text-xs text-muted-foreground tabular-nums">
                                <AnimatedNumber value={item.percentage} />% of total
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold tabular-nums">
                              {symbol}<AnimatedNumber value={item.amount} />
                            </p>
                            {item.budget > 0 && (
                              <p className="text-xs text-muted-foreground tabular-nums">
                                of {symbol}<AnimatedNumber value={item.budget} />
                              </p>
                            )}
                          </div>
                        </div>
                        {item.budget > 0 && (
                          <Progress
                            value={Math.min((item.amount / item.budget) * 100, 100)}
                            className="h-2"
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Budget Health */}
            {budgetHealth.length > 0 && (
              <FadeIn>
                <Card className="border-border/40 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base">Budget Health</CardTitle>
                    <CardDescription className="text-xs">
                      Category status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {budgetHealth.slice(0, 6).map((item: any) => (
                        <div key={item.category.id} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: item.status === 'danger' ? '#ef4444' :
                                    item.status === 'warning' ? '#f59e0b' : '#10b981'
                                }}
                              />
                              <span className="text-xs font-medium truncate max-w-[100px]">
                                {item.category.name}
                              </span>
                            </div>
                            <span className="text-xs font-bold tabular-nums">
                              <AnimatedNumber value={item.usage} />%
                            </span>
                          </div>
                          <Progress
                            value={Math.min(item.usage, 100)}
                            className="h-1.5"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {/* Monthly Comparison */}
            <FadeIn>
              <Card className="border-border/40 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Monthly Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">This Month</p>
                      <p className="text-2xl font-bold tabular-nums">
                        {symbol}<AnimatedNumber value={totalExpenses} />
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Last Month</p>
                      <p className="text-xl font-semibold text-muted-foreground tabular-nums">
                        {symbol}<AnimatedNumber value={previousMonthExpenses} />
                      </p>
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 p-3 rounded-xl",
                      monthOverMonthChange > 0 ? "bg-red-500/10" : "bg-green-500/10"
                    )}>
                      {monthOverMonthChange > 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-destructive" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-green-500" />
                      )}
                      <span className={cn(
                        "text-sm font-bold tabular-nums",
                        monthOverMonthChange > 0 ? "text-destructive" : "text-green-500"
                      )}>
                        {monthOverMonthChange > 0 ? '+' : ''}<AnimatedNumber value={Math.abs(monthOverMonthChange)} />%
                      </span>
                      <span className="text-xs text-muted-foreground">vs last month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Quick Stats */}
            <FadeIn>
              <Card className="border-border/40 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Transactions</span>
                      <span className="text-lg font-bold tabular-nums">
                        <AnimatedNumber value={currentMonthTransactions.length} />
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Daily Average</span>
                      <span className="text-lg font-bold tabular-nums">
                        {symbol}<AnimatedNumber value={daysElapsed > 0 ? totalExpenses / daysElapsed : 0} />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>

        {/* Smart Recommendations - Full Width */}
        {insights.length > 0 && (
          <FadeIn>
            <Card className="border-border/40 shadow-lg">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                  <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  Smart Recommendations
                </CardTitle>
                <CardDescription className="text-xs">
                  Personalized insights
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4 md:pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {insights.map((insight, index) => {
                    const Icon = insight.type === 'warning' ? AlertCircle :
                      insight.type === 'achievement' ? CheckCircle2 :
                        insight.type === 'opportunity' ? Zap : Sparkles;

                    const colors = {
                      warning: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
                      achievement: 'bg-green-500/10 border-green-500/20 text-green-600',
                      opportunity: 'bg-primary/10 border-primary/20 text-primary',
                      tip: 'bg-blue-500/10 border-blue-500/20 text-blue-600',
                    };

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "p-3 md:p-4 rounded-xl border backdrop-blur-sm",
                          colors[insight.type]
                        )}
                      >
                        <div className="flex items-start gap-2 md:gap-3">
                          <div className="p-1.5 md:p-2 rounded-lg bg-background/50 flex-shrink-0">
                            <Icon className="h-3 w-3 md:h-4 md:w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-0.5 md:mb-1">
                              {insight.title}
                            </p>
                            <p className="text-xs md:text-sm font-medium mb-1 md:mb-2">
                              {insight.message}
                            </p>
                            {(insight.action || insight.impact) && (
                              <div className="flex flex-wrap gap-1.5 md:gap-2 text-[10px] md:text-xs">
                                {insight.action && (
                                  <Badge variant="secondary" className="font-medium text-[10px] md:text-xs">
                                    {insight.action}
                                  </Badge>
                                )}
                                {insight.impact && (
                                  <Badge variant="outline" className="font-bold text-[10px] md:text-xs">
                                    {insight.impact}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        )}
      </div>
    </PageTransition>
  );
}
