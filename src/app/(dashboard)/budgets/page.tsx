'use client';

import { useState, useMemo } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { motion } from 'framer-motion';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared';
import { CategoryIcon } from '@/components/features/categories';
import { useBudgets } from '@/context/budgets-context';
import { useCategories } from '@/context/categories-context';
import { useTransactions } from '@/context/transactions-context';
import { useCurrency } from '@/hooks/use-currency';
import { cn, getMonthString } from '@/lib/utils';
import {
  Wallet,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Loader2,
  Target,
  TrendingDown,
  PiggyBank,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Minus,
  TrendingUp,
  BarChart3,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { BudgetAllocation } from '@/types';
import { Sparkline } from '@/components/charts';

export default function BudgetsPage() {
  const { categories } = useCategories();
  const { createBudget, updateBudget, getBudgetByMonth } = useBudgets();
  const { getCategoryTotal, getMonthlyTotal } = useTransactions();
  const { formatCurrency, symbol } = useCurrency();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const currentMonth = getMonthString(selectedDate);
  const currentBudget = getBudgetByMonth(currentMonth);
  const isCurrentMonth = getMonthString(new Date()) === currentMonth;

  const handlePrevMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const handleNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));

  const openCreateDialog = () => {
    if (currentBudget) {
      // Edit mode - populate with existing values
      setTotalBudget(currentBudget.totalAmount);
      const existingAllocations: Record<string, number> = {};
      currentBudget.allocations.forEach((a) => {
        existingAllocations[a.categoryId] = a.amount;
      });
      setAllocations(existingAllocations);
    } else {
      // Create mode - start fresh
      setTotalBudget(0);
      setAllocations({});
    }
    setDialogOpen(true);
  };

  const handleAllocationChange = (categoryId: string, value: string) => {
    const amount = parseFloat(value) || 0;
    setAllocations((prev) => ({ ...prev, [categoryId]: amount }));
  };

  const totalAllocated = useMemo(() => {
    return Object.values(allocations).reduce((sum, amount) => sum + amount, 0);
  }, [allocations]);

  const unallocatedAmount = totalBudget - totalAllocated;

  // Quick allocation helpers
  const distributeEvenly = () => {
    if (totalBudget <= 0 || categories.length === 0) return;
    const amountPerCategory = Math.floor(totalBudget / categories.length);
    const newAllocations: Record<string, number> = {};
    categories.forEach((cat) => {
      newAllocations[cat.id] = amountPerCategory;
    });
    setAllocations(newAllocations);
  };

  const clearAllocations = () => {
    setAllocations({});
  };

  const handleSaveBudget = async () => {
    if (totalBudget <= 0) {
      toast.error('Please enter a total budget amount');
      return;
    }

    setIsSaving(true);
    try {
      const budgetAllocations: BudgetAllocation[] = Object.entries(allocations)
        .filter(([, amount]) => amount > 0)
        .map(([categoryId, amount]) => ({ categoryId, amount }));

      if (currentBudget) {
        await updateBudget(currentBudget.id, {
          totalAmount: totalBudget,
          allocations: budgetAllocations,
        });
        toast.success('Budget updated successfully');
      } else {
        await createBudget({
          month: currentMonth,
          totalAmount: totalBudget,
          allocations: budgetAllocations,
        });
        toast.success('Budget created successfully');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate spending data
  const totalMonthSpent = getMonthlyTotal(currentMonth);

  const allocationsWithSpending = useMemo(() => {
    if (!currentBudget) return [];
    return currentBudget.allocations
      .map((allocation) => {
        const spent = getCategoryTotal(allocation.categoryId, currentMonth);
        const remaining = allocation.amount - spent;
        const percentage = allocation.amount > 0 ? (spent / allocation.amount) * 100 : 0;
        return {
          ...allocation,
          spent,
          remaining,
          percentage,
          category: categories.find((c) => c.id === allocation.categoryId),
        };
      })
      .sort((a, b) => b.percentage - a.percentage); // Sort by usage percentage
  }, [currentBudget, categories, getCategoryTotal, currentMonth]);

  const overallRemaining = currentBudget ? currentBudget.totalAmount - totalMonthSpent : 0;
  const overallPercentage = currentBudget?.totalAmount
    ? (totalMonthSpent / currentBudget.totalAmount) * 100
    : 0;

  // Stats
  const categoriesOverBudget = allocationsWithSpending.filter(a => a.percentage >= 100).length;
  const categoriesOnTrack = allocationsWithSpending.filter(a => a.percentage < 75).length;

  // NEW: Historical budget performance (last 6 months)
  const historicalPerformance = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const month = getMonthString(date);
      const budget = getBudgetByMonth(month);
      const spent = getMonthlyTotal(month);
      const adherence = budget?.totalAmount ? Math.min((spent / budget.totalAmount) * 100, 150) : 0;

      months.push({
        month,
        label: format(date, 'MMM'),
        budget: budget?.totalAmount || 0,
        spent,
        adherence,
        isCurrentMonth: month === currentMonth,
      });
    }
    return months;
  }, [getBudgetByMonth, getMonthlyTotal, currentMonth]);

  // NEW: Daily spending pace for current month (if budget exists)
  const dailyPace = useMemo(() => {
    if (!currentBudget) return [];

    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    const today = new Date().getDate();
    const dailyBudget = currentBudget.totalAmount / daysInMonth;

    // Calculate cumulative ideal vs actual for each day
    const pace = [];
    let cumulativeActual = 0;

    for (let day = 1; day <= Math.min(today, daysInMonth); day++) {
      const idealCumulative = dailyBudget * day;
      // This is simplified - in reality you'd need daily transaction data
      // For now, we'll estimate based on current spending
      cumulativeActual = (totalMonthSpent / today) * day;

      pace.push({
        day,
        ideal: idealCumulative,
        actual: cumulativeActual,
      });
    }

    return pace;
  }, [currentBudget, selectedDate, totalMonthSpent]);

  // Status helpers
  const getBudgetStatus = () => {
    if (!currentBudget) return null;
    if (overallPercentage >= 100) return { label: 'Over Budget', color: 'destructive', icon: AlertTriangle };
    if (overallPercentage >= 80) return { label: 'Almost There', color: 'warning', icon: AlertTriangle };
    return { label: 'On Track', color: 'success', icon: CheckCircle2 };
  };

  const budgetStatus = getBudgetStatus();

  return (
    <PageTransition>
      <div className="space-y-4 pb-20 lg:pb-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold lg:text-2xl">Budgets</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {format(selectedDate, 'MMMM yyyy')}
            </p>
          </div>
          <button
            onClick={openCreateDialog}
            className="flex h-9 w-9 lg:w-auto lg:h-auto lg:px-4 lg:py-2.5 items-center justify-center lg:gap-2 rounded-xl font-medium text-[#101010] shadow-lg"
            style={{
              background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
              boxShadow: '0 0 12px rgba(152, 239, 90, 0.25)',
            }}
          >
            {currentBudget ? (
              <>
                <Pencil className="h-4 w-4" />
                <span className="hidden lg:inline">Edit Budget</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span className="hidden lg:inline">Create Budget</span>
              </>
            )}
          </button>
        </div>

        {/* Month Navigator */}
        <Card>
          <CardContent className="flex items-center justify-between py-3 px-4">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-9 w-9">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <h3 className="text-base font-semibold">
                {format(selectedDate, 'MMMM yyyy')}
              </h3>
              {isCurrentMonth && (
                <Badge variant="outline" className="text-[10px] mt-1">Current Month</Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-9 w-9">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>

        {currentBudget ? (
          <>
            {/* Budget Summary Card */}
            <FadeIn>
              <motion.div
                className="relative overflow-hidden rounded-2xl p-5"
                style={{
                  background: overallPercentage >= 100
                    ? 'linear-gradient(145deg, #f87171 0%, #ef4444 100%)'
                    : overallPercentage >= 80
                      ? 'linear-gradient(145deg, #fbbf24 0%, #f59e0b 100%)'
                      : 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
                  boxShadow: overallPercentage >= 100
                    ? '0 0 40px rgba(248, 113, 113, 0.25)'
                    : overallPercentage >= 80
                      ? '0 0 40px rgba(251, 191, 36, 0.25)'
                      : '0 0 40px rgba(152, 239, 90, 0.25)',
                }}
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {budgetStatus && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                          <budgetStatus.icon className={cn(
                            "h-3.5 w-3.5",
                            overallPercentage >= 100 ? "text-white" : "text-[#101010]"
                          )} />
                          <span className={cn(
                            "text-xs font-semibold",
                            overallPercentage >= 100 ? "text-white" : "text-[#101010]"
                          )}>
                            {budgetStatus.label}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-xl sm:text-2xl font-bold",
                      overallPercentage >= 100 ? "text-white" : "text-[#101010]"
                    )}>
                      {Math.round(overallPercentage)}%
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className={cn(
                      "text-[11px] font-semibold tracking-wide uppercase mb-1",
                      overallPercentage >= 100 ? "text-white/60" : "text-[#101010]/50"
                    )}>
                      {overallRemaining >= 0 ? 'Remaining' : 'Over Budget'}
                    </p>
                    <p className={cn(
                      "text-2xl sm:text-3xl font-bold tracking-tight",
                      overallPercentage >= 100 ? "text-white" : "text-[#101010]"
                    )}>
                      {overallRemaining < 0 && '-'}{symbol}{Math.abs(overallRemaining).toLocaleString()}
                    </p>
                    <p className={cn(
                      "text-sm mt-1",
                      overallPercentage >= 100 ? "text-white/70" : "text-[#101010]/60"
                    )}>
                      {formatCurrency(totalMonthSpent)} of {formatCurrency(currentBudget.totalAmount)} spent
                    </p>
                  </div>

                  <div className="h-3 rounded-full bg-white/30 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(overallPercentage, 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-white/80"
                    />
                  </div>
                </div>
              </motion.div>
            </FadeIn>

            {/* Quick Stats */}
            <StaggerContainer>
              <div className="grid grid-cols-3 gap-3">
                <StaggerItem>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="flex justify-center mb-1.5">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                          <Target className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <p className="text-base sm:text-lg font-bold">{allocationsWithSpending.length}</p>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground">Categories</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
                <StaggerItem>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="flex justify-center mb-1.5">
                        <div className="p-1.5 rounded-lg bg-green-500/10">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                      <p className="text-base sm:text-lg font-bold">{categoriesOnTrack}</p>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground">On Track</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
                <StaggerItem>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="flex justify-center mb-1.5">
                        <div className="p-1.5 rounded-lg bg-destructive/10">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        </div>
                      </div>
                      <p className="text-base sm:text-lg font-bold">{categoriesOverBudget}</p>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground">Over Budget</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              </div>
            </StaggerContainer>

            {/* NEW: Historical Budget Performance */}
            {historicalPerformance.some(m => m.budget > 0) && (
              <FadeIn>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      6-Month Performance
                    </CardTitle>
                    <CardDescription>Budget adherence over time</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {historicalPerformance.map((month, index) => {
                      if (month.budget === 0) return null;
                      const isOverBudget = month.adherence >= 100;

                      return (
                        <motion.div
                          key={month.month}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className={cn(
                              "font-medium",
                              month.isCurrentMonth && "text-primary"
                            )}>
                              {month.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-xs">
                                {formatCurrency(month.spent)} / {formatCurrency(month.budget)}
                              </span>
                              <span className={cn(
                                "text-xs font-semibold",
                                isOverBudget ? "text-destructive" : "text-primary"
                              )}>
                                {month.adherence.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(month.adherence, 100)}%` }}
                              transition={{ duration: 0.6, delay: index * 0.05 + 0.2 }}
                              className={cn(
                                "h-full rounded-full",
                                isOverBudget ? "bg-destructive" : "bg-primary"
                              )}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {/* NEW: Daily Spending Pace (only for current month with budget) */}
            {isCurrentMonth && currentBudget && dailyPace.length > 0 && (
              <FadeIn>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Daily Spending Pace
                    </CardTitle>
                    <CardDescription>
                      Actual vs ideal cumulative spending
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Sparkline visualization */}
                      <div className="relative h-24 bg-muted/20 rounded-lg p-3">
                        <div className="absolute inset-3">
                          <Sparkline
                            data={dailyPace.map(d => d.ideal)}
                            color="#98EF5A"
                            height={72}
                            showDots={false}
                          />
                        </div>
                        <div className="absolute inset-3">
                          <Sparkline
                            data={dailyPace.map(d => d.actual)}
                            color={totalMonthSpent > (currentBudget.totalAmount * (new Date().getDate() / new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate())) ? "#ef4444" : "#3b82f6"}
                            height={72}
                            showDots={false}
                          />
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center justify-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-0.5 bg-primary rounded" />
                          <span className="text-muted-foreground">Ideal Pace</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "w-3 h-0.5 rounded",
                            totalMonthSpent > (currentBudget.totalAmount * (new Date().getDate() / new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()))
                              ? "bg-destructive"
                              : "bg-blue-500"
                          )} />
                          <span className="text-muted-foreground">Actual Pace</span>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-3 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Projected Total</p>
                          <p className={cn(
                            "text-sm font-semibold mt-0.5",
                            dailyPace[dailyPace.length - 1]?.actual > currentBudget.totalAmount && "text-destructive"
                          )}>
                            {formatCurrency(dailyPace[dailyPace.length - 1]?.actual * (new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate() / new Date().getDate()) || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Days Remaining</p>
                          <p className="text-sm font-semibold mt-0.5">
                            {new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate() - new Date().getDate()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {/* Category Allocations */}
            {allocationsWithSpending.length > 0 && (
              <FadeIn>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Category Budgets</CardTitle>
                    <CardDescription>Sorted by usage</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {allocationsWithSpending.map((allocation, index) => (
                      <motion.div
                        key={allocation.categoryId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {allocation.category && (
                              <CategoryIcon
                                icon={allocation.category.icon}
                                color={allocation.category.color}
                                size="md"
                              />
                            )}
                            <div>
                              <span className="font-medium text-sm">
                                {allocation.category?.name || 'Unknown'}
                              </span>
                              <p className="text-[10px] text-muted-foreground">
                                {allocation.percentage >= 100 ? (
                                  <span className="text-destructive">Over by {formatCurrency(Math.abs(allocation.remaining))}</span>
                                ) : (
                                  <span>{formatCurrency(allocation.remaining)} left</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={cn(
                              'text-sm font-semibold',
                              allocation.percentage >= 100 && 'text-destructive'
                            )}>
                              {formatCurrency(allocation.spent)}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {' '}/ {formatCurrency(allocation.amount)}
                            </span>
                          </div>
                        </div>
                        <div className="relative">
                          <Progress
                            value={Math.min(allocation.percentage, 100)}
                            className={cn('h-2', {
                              '[&>div]:bg-primary': allocation.percentage < 75,
                              '[&>div]:bg-yellow-500': allocation.percentage >= 75 && allocation.percentage < 100,
                              '[&>div]:bg-destructive': allocation.percentage >= 100,
                            })}
                          />
                          {allocation.percentage > 100 && (
                            <div
                              className="absolute top-0 right-0 h-2 rounded-r-full bg-destructive/30"
                              style={{ width: `${Math.min((allocation.percentage - 100) / 2, 20)}%` }}
                            />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {allocationsWithSpending.length === 0 && (
              <FadeIn>
                <Card className="py-8">
                  <EmptyState
                    icon={<PiggyBank className="h-10 w-10" />}
                    title="No category allocations"
                    description="Edit your budget to allocate amounts to specific categories for detailed tracking."
                    action={{
                      label: 'Edit Budget',
                      onClick: openCreateDialog,
                    }}
                  />
                </Card>
              </FadeIn>
            )}
          </>
        ) : (
          <FadeIn>
            <Card className="py-12">
              <EmptyState
                icon={<Wallet className="h-10 w-10" />}
                title="No budget set"
                description={`Create a budget for ${format(selectedDate, 'MMMM yyyy')} to start tracking your spending goals.`}
                action={{
                  label: 'Create Budget',
                  onClick: openCreateDialog,
                }}
              />
            </Card>
          </FadeIn>
        )}

        {/* Create/Edit Budget Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] flex flex-col sm:max-w-lg">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <div
                  className="p-2 rounded-xl"
                  style={{
                    background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
                  }}
                >
                  <Target className="h-4 w-4 text-[#101010]" />
                </div>
                {currentBudget ? 'Edit' : 'Create'} Budget
              </DialogTitle>
              <DialogDescription>
                Set your budget for {format(selectedDate, 'MMMM yyyy')}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-5 py-2 -mx-6 px-6">
              {/* Total Budget Input */}
              <div className="space-y-2">
                <Label htmlFor="totalBudget" className="text-sm font-medium">
                  Total Monthly Budget
                </Label>
                <div className="relative">
                  <span className="text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 text-base sm:text-lg font-medium">
                    {symbol}
                  </span>
                  <Input
                    id="totalBudget"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9 text-xl sm:text-2xl font-bold h-12 sm:h-14 rounded-xl"
                    value={totalBudget || ''}
                    onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                  />
                </div>
                {totalBudget > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Daily budget: ~{formatCurrency(totalBudget / 30)}
                  </p>
                )}
              </div>

              {/* Allocation Summary Bar */}
              {totalBudget > 0 && (
                <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Allocated</span>
                    <span className={cn(
                      "font-semibold",
                      totalAllocated > totalBudget ? "text-destructive" : "text-foreground"
                    )}>
                      {formatCurrency(totalAllocated)} / {formatCurrency(totalBudget)}
                    </span>
                  </div>
                  <Progress
                    value={totalBudget > 0 ? Math.min((totalAllocated / totalBudget) * 100, 100) : 0}
                    className={cn("h-2", {
                      "[&>div]:bg-primary": totalAllocated <= totalBudget,
                      "[&>div]:bg-destructive": totalAllocated > totalBudget,
                    })}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn(
                      unallocatedAmount >= 0 ? "text-muted-foreground" : "text-destructive"
                    )}>
                      {unallocatedAmount >= 0
                        ? `${formatCurrency(unallocatedAmount)} unallocated`
                        : `${formatCurrency(Math.abs(unallocatedAmount))} over-allocated`
                      }
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={distributeEvenly}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Sparkles className="h-3 w-3" />
                        Distribute evenly
                      </button>
                      {Object.keys(allocations).length > 0 && (
                        <button
                          type="button"
                          onClick={clearAllocations}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Category Allocations */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Category Allocations</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  Optional: Set limits for individual categories
                </p>

                <div className="space-y-2">
                  {categories.map((category, index) => {
                    const allocation = allocations[category.id] || 0;
                    const percentage = totalBudget > 0 ? (allocation / totalBudget) * 100 : 0;

                    return (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl transition-colors",
                          allocation > 0 ? "bg-muted/50" : "bg-transparent hover:bg-muted/30"
                        )}
                      >
                        <div
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                          style={{
                            background: `${category.color}15`,
                          }}
                        >
                          <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{category.name}</p>
                          {allocation > 0 && totalBudget > 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              {percentage.toFixed(0)}% of budget
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const newAmount = Math.max(0, (allocations[category.id] || 0) - 50);
                              handleAllocationChange(category.id, newAmount.toString());
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="relative w-24">
                            <span className="text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 text-sm">
                              {symbol}
                            </span>
                            <Input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              className="pl-6 h-9 text-right pr-2 text-sm font-medium"
                              value={allocations[category.id] || ''}
                              onChange={(e) => handleAllocationChange(category.id, e.target.value)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const newAmount = (allocations[category.id] || 0) + 50;
                              handleAllocationChange(category.id, newAmount.toString());
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveBudget}
                disabled={isSaving || totalBudget <= 0}
                className="flex-1 sm:flex-none gap-2"
                style={{
                  background: totalBudget > 0
                    ? 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)'
                    : undefined,
                  color: totalBudget > 0 ? '#101010' : undefined,
                }}
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {currentBudget ? 'Update' : 'Create'} Budget
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
