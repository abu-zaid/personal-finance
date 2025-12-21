'use client';

import { useMemo } from 'react';
import { format, subDays, startOfDay, isSameDay, subMonths, getDaysInMonth } from 'date-fns';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

import { PageTransition, FadeIn } from '@/components/animations';
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
import { SpendingVelocityGauge } from '@/components/charts';
import { useSmartInsights } from '@/hooks/use-smart-insights';
import { getMonthString, cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { transactions, isLoading: transactionsLoading, getMonthlyIncome, getMonthlyExpenses } = useTransactions();
  const { getBudgetByMonth, isLoading: budgetsLoading } = useBudgets();
  const { formatCurrency, symbol } = useCurrency();
  const insights = useSmartInsights();

  const isDataLoading = categoriesLoading || transactionsLoading || budgetsLoading;

  const currentMonth = getMonthString(new Date());
  const previousMonth = getMonthString(subMonths(new Date(), 1));
  const currentMonthBudget = getBudgetByMonth(currentMonth);

  // Calculate key metrics
  const totalIncome = getMonthlyIncome(currentMonth);
  const totalExpenses = getMonthlyExpenses(currentMonth);
  const netPosition = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netPosition / totalIncome) * 100) : 0;
  const totalBudget = currentMonthBudget?.totalAmount ?? 0;
  const budgetRemaining = totalBudget - totalExpenses;

  const previousMonthExpenses = getMonthlyExpenses(previousMonth);
  const monthOverMonthChange = previousMonthExpenses > 0
    ? ((totalExpenses - previousMonthExpenses) / previousMonthExpenses) * 100
    : 0;

  const daysInMonth = getDaysInMonth(new Date());
  const daysElapsed = new Date().getDate();
  const daysRemaining = daysInMonth - daysElapsed;
  const monthProgress = (daysElapsed / daysInMonth) * 100;

  // Current month transactions
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const transactionMonth = getMonthString(new Date(t.date));
      return transactionMonth === currentMonth && t.type === 'expense';
    });
  }, [transactions, currentMonth]);

  // Last 30 days cash flow data
  const cashFlowData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dateStr = format(date, 'dd');

      const dayIncome = transactions
        .filter(t => isSameDay(new Date(t.date), date) && t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const dayExpenses = transactions
        .filter(t => isSameDay(new Date(t.date), date) && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      days.push({
        date: dateStr,
        income: dayIncome,
        expenses: dayExpenses,
        net: dayIncome - dayExpenses,
      });
    }
    return days;
  }, [transactions]);

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

        {/* Hero - Financial Overview */}
        <FadeIn>
          <Card className="border-border/40 shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
            <CardContent className="p-4 md:p-6 relative">
              <div className="grid grid-cols-1 gap-4 md:gap-6">
                {/* Net Position */}
                <div>
                  <p className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1 md:mb-2">
                    Net Position
                  </p>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={cn(
                      "text-2xl md:text-4xl font-bold",
                      netPosition >= 0 ? "text-green-500" : "text-destructive"
                    )}>
                      {netPosition >= 0 ? '+' : ''}{formatCurrency(netPosition)}
                    </span>
                    {savingsRate > 0 && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] md:text-xs">
                        {savingsRate.toFixed(0)}% saved
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:gap-4 mt-3 md:mt-6">
                    <div>
                      <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                        <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                        <span className="text-[10px] md:text-xs text-muted-foreground font-medium">Income</span>
                      </div>
                      <p className="text-sm md:text-2xl font-bold text-green-500">{formatCurrency(totalIncome)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                        <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-destructive" />
                        <span className="text-[10px] md:text-xs text-muted-foreground font-medium">Expenses</span>
                      </div>
                      <p className="text-sm md:text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                        <Calendar className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                        <span className="text-[10px] md:text-xs text-muted-foreground font-medium">Days Left</span>
                      </div>
                      <p className="text-sm md:text-2xl font-bold">{daysRemaining}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Mobile: Tabs for Charts */}
        <div className="lg:hidden">
          <Tabs defaultValue="velocity" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="velocity" className="text-xs py-2">
                <Zap className="h-3 w-3 mr-1" />
                Velocity
              </TabsTrigger>
              <TabsTrigger value="flow" className="text-xs py-2">
                <Activity className="h-3 w-3 mr-1" />
                Flow
              </TabsTrigger>
              <TabsTrigger value="categories" className="text-xs py-2">
                <BarChart3 className="h-3 w-3 mr-1" />
                Categories
              </TabsTrigger>
            </TabsList>

            {/* Spending Velocity */}
            {totalBudget > 0 && (
              <TabsContent value="velocity" className="mt-4">
                <Card className="border-border/40 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm md:text-base">Spending Velocity</CardTitle>
                    <CardDescription className="text-xs">Your spending pace vs budget</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <SpendingVelocityGauge
                      currentSpending={totalExpenses}
                      budget={totalBudget}
                      daysElapsed={daysElapsed}
                      daysInMonth={daysInMonth}
                    />
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/50">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Budget</p>
                        <p className="text-xs font-bold">{formatCurrency(totalBudget)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Spent</p>
                        <p className="text-xs font-bold">{formatCurrency(totalExpenses)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Left</p>
                        <p className={cn(
                          "text-xs font-bold",
                          budgetRemaining >= 0 ? "text-green-500" : "text-destructive"
                        )}>
                          {formatCurrency(budgetRemaining)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Cash Flow */}
            <TabsContent value="flow" className="mt-4">
              <Card className="border-border/40 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm md:text-base">Cash Flow</CardTitle>
                  <CardDescription className="text-xs">Last 30 days</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={cashFlowData}>
                      <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        interval={4}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        width={35}
                        tickFormatter={(value) => `${symbol}${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#incomeGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fill="url(#expensesGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Top Categories */}
            <TabsContent value="categories" className="mt-4">
              <Card className="border-border/40 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm md:text-base">Top Categories</CardTitle>
                  <CardDescription className="text-xs">Where money goes</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-3">
                    {topCategories.map((item, index) => (
                      <div key={item.category.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className="p-1.5 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: `${item.category.color}20` }}
                            >
                              <CategoryIcon
                                icon={item.category.icon}
                                color={item.category.color}
                                size="sm"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-xs truncate">{item.category.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {item.percentage.toFixed(0)}% of total
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-xs ml-2">{formatCurrency(item.amount)}</p>
                        </div>
                        {item.budget > 0 && (
                          <Progress
                            value={Math.min((item.amount / item.budget) * 100, 100)}
                            className="h-1.5"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Spending Velocity */}
            {totalBudget > 0 && (
              <FadeIn>
                <Card className="border-border/40 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Spending Velocity
                    </CardTitle>
                    <CardDescription>
                      Your spending pace compared to budget
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SpendingVelocityGauge
                      currentSpending={totalExpenses}
                      budget={totalBudget}
                      daysElapsed={daysElapsed}
                      daysInMonth={daysInMonth}
                    />
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Budget</p>
                        <p className="text-sm font-bold">{formatCurrency(totalBudget)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Spent</p>
                        <p className="text-sm font-bold">{formatCurrency(totalExpenses)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                        <p className={cn(
                          "text-sm font-bold",
                          budgetRemaining >= 0 ? "text-green-500" : "text-destructive"
                        )}>
                          {formatCurrency(budgetRemaining)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {/* Cash Flow Chart */}
            <FadeIn>
              <Card className="border-border/40 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Cash Flow Trend
                  </CardTitle>
                  <CardDescription>
                    Last 30 days income vs expenses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={cashFlowData}>
                      <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                      <XAxis
                        dataKey="date"
                        className="text-xs"
                        tick={{ fill: 'currentColor', className: 'fill-muted-foreground' }}
                        tickLine={false}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fill: 'currentColor', className: 'fill-muted-foreground' }}
                        tickLine={false}
                        tickFormatter={(value) => `${symbol}${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#incomeGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fill="url(#expensesGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
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
                              <p className="text-xs text-muted-foreground">
                                {item.percentage.toFixed(0)}% of total
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(item.amount)}</p>
                            {item.budget > 0 && (
                              <p className="text-xs text-muted-foreground">
                                of {formatCurrency(item.budget)}
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
                            <span className="text-xs font-bold">
                              {item.usage.toFixed(0)}%
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
                      <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Last Month</p>
                      <p className="text-xl font-semibold text-muted-foreground">
                        {formatCurrency(previousMonthExpenses)}
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
                        "text-sm font-bold",
                        monthOverMonthChange > 0 ? "text-destructive" : "text-green-500"
                      )}>
                        {monthOverMonthChange > 0 ? '+' : ''}{monthOverMonthChange.toFixed(1)}%
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
                      <span className="text-lg font-bold">{currentMonthTransactions.length}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Daily Average</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(daysElapsed > 0 ? totalExpenses / daysElapsed : 0)}
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
