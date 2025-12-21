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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Activity,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { BudgetAllocation } from '@/types';
import { Sparkline } from '@/components/charts';
import { useMediaQuery } from '@/hooks/use-media-query';

// --- Helper Functions ---

// --- BudgetForm Component ---
interface BudgetFormProps {
  totalBudget: number;
  setTotalBudget: (val: number) => void;
  allocations: Record<string, number>;
  setAllocations: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  categories: any[]; // Using any for simplicity in this context, ideally strictly typed
  symbol: string;
  formatCurrency: (val: number) => string;
}

function BudgetForm({
  totalBudget,
  setTotalBudget,
  allocations,
  setAllocations,
  categories,
  symbol,
  formatCurrency,
}: BudgetFormProps) {

  const totalAllocated = Object.values(allocations).reduce((sum, amount) => sum + amount, 0);
  const unallocatedAmount = totalBudget - totalAllocated;

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

  const handleAllocationChange = (categoryId: string, value: string) => {
    const amount = parseFloat(value) || 0;
    setAllocations((prev) => ({ ...prev, [categoryId]: amount }));
  };

  return (
    <div className="space-y-6">
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
            className="pl-9 text-xl sm:text-2xl font-bold h-12 sm:h-14 rounded-2xl bg-muted/30 border-transparent focus:border-primary/50 focus:bg-background transition-all"
            value={totalBudget || ''}
            onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
          />
        </div>
        {totalBudget > 0 && (
          <p className="text-xs text-muted-foreground px-1">
            Daily budget: ~{formatCurrency(totalBudget / 30)}
          </p>
        )}
      </div>

      {/* Allocation Summary Bar */}
      {totalBudget > 0 && (
        <div className="p-4 rounded-2xl bg-muted/40 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Allocated</span>
            <span
              className={cn(
                "font-semibold",
                totalAllocated > totalBudget ? "text-destructive" : "text-foreground"
              )}
            >
              {formatCurrency(totalAllocated)} / {formatCurrency(totalBudget)}
            </span>
          </div>
          <Progress
            value={totalBudget > 0 ? Math.min((totalAllocated / totalBudget) * 100, 100) : 0}
            className={cn("h-2.5 rounded-full bg-background", {
              "[&>div]:bg-primary": totalAllocated <= totalBudget,
              "[&>div]:bg-destructive": totalAllocated > totalBudget,
            })}
          />
          <div className="flex items-center justify-between text-xs pt-1">
            <span
              className={cn(
                unallocatedAmount >= 0 ? "text-muted-foreground" : "text-destructive font-medium"
              )}
            >
              {unallocatedAmount >= 0
                ? `${formatCurrency(unallocatedAmount)} unallocated`
                : `${formatCurrency(Math.abs(unallocatedAmount))} over-allocated`}
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={distributeEvenly}
                className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <Sparkles className="h-3 w-3" />
                Distribute
              </button>
              {Object.keys(allocations).length > 0 && (
                <button
                  type="button"
                  onClick={clearAllocations}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Allocations */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Category Allocations</Label>
          <p className="text-xs text-muted-foreground">
            Optional: Set limits for specific categories
          </p>
        </div>

        <div className="space-y-3">
          {categories.map((category) => {
            const allocation = allocations[category.id] || 0;
            const percentage = totalBudget > 0 ? (allocation / totalBudget) * 100 : 0;

            return (
              <div
                key={category.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl transition-all border border-transparent",
                  allocation > 0 ? "bg-background shadow-sm border-border/40" : "bg-muted/20 hover:bg-muted/40"
                )}
              >
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${category.color}15` }}
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

                <div className="w-24 sm:w-32 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                    {symbol}
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    className="h-9 pl-6 pr-2 text-right text-sm rounded-lg bg-transparent border-border/50 focus:bg-background"
                    value={allocation || ''}
                    onChange={(e) => handleAllocationChange(category.id, e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


export default function BudgetsPage() {
  const { categories } = useCategories();
  const { createBudget, updateBudget, getBudgetByMonth } = useBudgets();
  const { getCategoryTotal, getMonthlyTotal } = useTransactions();
  const { formatCurrency, symbol } = useCurrency();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Budget Form State
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const currentMonth = getMonthString(selectedDate);
  const currentBudget = getBudgetByMonth(currentMonth);
  const isCurrentMonth = getMonthString(new Date()) === currentMonth;

  const handlePrevMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const handleNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));

  const openCreateDialog = () => {
    if (currentBudget) {
      setTotalBudget(currentBudget.totalAmount);
      const existingAllocations: Record<string, number> = {};
      currentBudget.allocations.forEach((a) => {
        existingAllocations[a.categoryId] = a.amount;
      });
      setAllocations(existingAllocations);
    } else {
      setTotalBudget(0);
      setAllocations({});
    }
    setDialogOpen(true);
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
        toast.success('Budget updated');
      } else {
        await createBudget({
          month: currentMonth,
          totalAmount: totalBudget,
          allocations: budgetAllocations,
        });
        toast.success('Budget created');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Calculations ---
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
      .sort((a, b) => b.percentage - a.percentage);
  }, [currentBudget, categories, getCategoryTotal, currentMonth]);

  const overallRemaining = currentBudget ? currentBudget.totalAmount - totalMonthSpent : 0;
  const overallPercentage = currentBudget?.totalAmount
    ? (totalMonthSpent / currentBudget.totalAmount) * 100
    : 0;

  const categoriesOverBudget = allocationsWithSpending.filter(a => a.percentage >= 100).length;
  const categoriesOnTrack = allocationsWithSpending.filter(a => a.percentage < 75).length;

  const getBudgetStatus = () => {
    if (!currentBudget) return null;
    if (overallPercentage >= 100) return { label: 'Over Budget', color: 'destructive', icon: AlertTriangle };
    if (overallPercentage >= 80) return { label: 'Almost There', color: 'warning', icon: AlertTriangle };
    return { label: 'On Track', color: 'success', icon: CheckCircle2 };
  };
  const budgetStatus = getBudgetStatus();

  return (
    <PageTransition>
      <div className="space-y-4 p-4 pb-32 md:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-2xl font-bold">Budgets</h1>
            <p className="text-muted-foreground text-sm">
              Manage your spending limits
            </p>
          </div>
          <Button
            onClick={openCreateDialog}
            className="rounded-full px-5 shadow-sm hover:shadow-md transition-all bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {currentBudget ? (
              <>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Create
              </>
            )}
          </Button>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center justify-between bg-white dark:bg-card p-2 rounded-2xl shadow-sm border">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-xl">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <h3 className="text-sm font-semibold">
              {format(selectedDate, 'MMMM yyyy')}
            </h3>
            {isCurrentMonth && (
              <span className="text-[10px] text-primary font-medium block -mt-0.5">Current</span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 rounded-xl">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {currentBudget ? (
          <>
            {/* Hero Card */}
            <FadeIn>
              <div
                className={cn(
                  "relative overflow-hidden rounded-[2rem] p-6 shadow-xl bg-gradient-to-br",
                  overallPercentage >= 100
                    ? "from-destructive to-destructive/80 text-destructive-foreground"
                    : overallPercentage >= 80
                      ? "from-amber-500 to-amber-600 text-white"
                      : "from-primary to-primary/80 text-primary-foreground"
                )}
              >
                <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/10 blur-3xl opacity-50" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="opacity-90 text-xs font-semibold uppercase tracking-wider mb-1">
                        {overallRemaining >= 0 ? 'Remaining Budget' : 'Over Budget'}
                      </p>
                      <h2 className="text-4xl font-bold tracking-tight">
                        {overallRemaining < 0 && '-'}{formatCurrency(Math.abs(overallRemaining))}
                      </h2>
                    </div>
                    <div className="bg-black/10 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5">
                      {budgetStatus && <budgetStatus.icon className="h-3.5 w-3.5" />}
                      <span className="text-xs font-bold">{Math.round(overallPercentage)}%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs opacity-90 font-medium">
                      <span>{formatCurrency(totalMonthSpent)} spent</span>
                      <span>{formatCurrency(currentBudget.totalAmount)} limit</span>
                    </div>
                    <div className="h-2.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(overallPercentage, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-white/90 rounded-full shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-card">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-bold">{categoriesOnTrack}</span>
                  <span className="text-xs text-muted-foreground">On Track</span>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-card">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center mb-2">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-bold">{categoriesOverBudget}</span>
                  <span className="text-xs text-muted-foreground">Over Budget</span>
                </CardContent>
              </Card>
            </div>

            {/* Category List */}
            {allocationsWithSpending.length > 0 ? (
              <StaggerContainer className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground pl-1">Category Breakdown</h3>
                {allocationsWithSpending.map((item) => (
                  <StaggerItem key={item.categoryId}>
                    <div className="bg-white dark:bg-card p-4 rounded-3xl border shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {item.category && (
                            <div className="relative">
                              <div className="absolute inset-0 rounded-full opacity-20" style={{ backgroundColor: item.category.color }} />
                              <CategoryIcon icon={item.category.icon} color={item.category.color} size="md" className="relative z-10" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-sm">{item.category?.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {item.percentage >= 100
                                ? <span className="text-destructive font-medium">Over by {formatCurrency(Math.abs(item.remaining))}</span>
                                : <span>{formatCurrency(item.remaining)} left</span>
                              }
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("font-bold text-sm", item.percentage >= 100 && "text-destructive")}>
                            {formatCurrency(item.spent)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            of {formatCurrency(item.amount)}
                          </p>
                        </div>
                      </div>
                      <Progress
                        value={Math.min(item.percentage, 100)}
                        className={cn("h-2 rounded-full", {
                          "[&>div]:bg-primary": item.percentage < 80,
                          "[&>div]:bg-yellow-500": item.percentage >= 80 && item.percentage < 100,
                          "[&>div]:bg-destructive": item.percentage >= 100,
                        })}
                      />
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <EmptyState
                icon={<Sparkles className="h-10 w-10 text-muted-foreground" />}
                title="No category limits"
                description="Set specific limits for categories to track them better."
                action={{ label: "Add Allocations", onClick: openCreateDialog }}
              />
            )}
          </>
        ) : (
          <div className="py-12">
            <EmptyState
              icon={<Wallet className="h-12 w-12 text-muted-foreground" />}
              title="No budget set"
              description={`Create a budget for ${format(selectedDate, 'MMMM')} to start tracking.`}
              action={{ label: "Create Budget", onClick: openCreateDialog }}
            />
          </div>
        )}
      </div>

      {/* Drawer/Dialog Logic */}
      {isDesktop ? (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{currentBudget ? 'Edit' : 'Create'} Budget</DialogTitle>
              <DialogDescription>Plan your spending for {format(selectedDate, 'MMMM')}</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-1">
              <BudgetForm
                totalBudget={totalBudget}
                setTotalBudget={setTotalBudget}
                allocations={allocations}
                setAllocations={setAllocations}
                categories={categories}
                symbol={symbol}
                formatCurrency={formatCurrency}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveBudget} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Budget
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
          <SheetContent side="bottom" className="flex flex-col rounded-t-[2rem] p-0 h-[92vh] max-h-[92vh]">
            <div className="flex-1 overflow-y-auto p-6 pb-0">
              <SheetHeader className="text-left mb-6 px-1">
                <SheetTitle className="text-xl">{currentBudget ? 'Edit' : 'Create'} Budget</SheetTitle>
                <SheetDescription>Plan your spending for {format(selectedDate, 'MMMM')}</SheetDescription>
              </SheetHeader>

              <BudgetForm
                totalBudget={totalBudget}
                setTotalBudget={setTotalBudget}
                allocations={allocations}
                setAllocations={setAllocations}
                categories={categories}
                symbol={symbol}
                formatCurrency={formatCurrency}
              />

              {/* Spacer for sticky footer coverage */}
              <div className="h-12" />
            </div>

            {/* Sticky Footer */}
            <div className="p-6 pt-2 bg-background border-t">
              <div className="flex flex-row gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 rounded-2xl h-14 text-base font-medium">
                  Cancel
                </Button>
                <Button onClick={handleSaveBudget} disabled={isSaving} className="flex-1 rounded-2xl h-14 text-base font-bold">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </PageTransition>
  );
}
