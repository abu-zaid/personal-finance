'use client';

import { useState, useMemo } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { PageTransition, FadeIn } from '@/components/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import { Wallet, ChevronLeft, ChevronRight, Plus, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BudgetAllocation } from '@/types';

export default function BudgetsPage() {
  const { categories } = useCategories();
  const { createBudget, updateBudget, getBudgetByMonth } = useBudgets();
  const { getCategoryTotal } = useTransactions();
  const { formatCurrency, symbol } = useCurrency();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const currentMonth = getMonthString(selectedDate);
  const currentBudget = getBudgetByMonth(currentMonth);

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

  const handleSaveBudget = async () => {
    if (totalBudget <= 0) {
      toast.error('Please enter a total budget amount');
      return;
    }

    setIsSaving(true);
    try {
      const budgetAllocations: BudgetAllocation[] = Object.entries(allocations)
        .filter(([_, amount]) => amount > 0)
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
  const allocationsWithSpending = useMemo(() => {
    if (!currentBudget) return [];
    return currentBudget.allocations.map((allocation) => {
      const spent = getCategoryTotal(allocation.categoryId, currentMonth);
      const remaining = allocation.amount - spent;
      const percentage = allocation.amount > 0 ? Math.min(100, (spent / allocation.amount) * 100) : 0;
      return {
        ...allocation,
        spent,
        remaining,
        percentage,
        category: categories.find((c) => c.id === allocation.categoryId),
      };
    });
  }, [currentBudget, categories, getCategoryTotal, currentMonth]);

  const totalSpent = allocationsWithSpending.reduce((sum, a) => sum + a.spent, 0);
  const overallPercentage = currentBudget?.totalAmount
    ? Math.min(100, (totalSpent / currentBudget.totalAmount) * 100)
    : 0;

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-h1 lg:text-2xl lg:font-bold">Budgets</h1>
            <p className="text-muted-foreground text-sm">Manage your monthly spending</p>
          </div>
          <Button onClick={openCreateDialog} className="w-full sm:w-auto">
            {currentBudget ? (
              <>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Budget
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Budget
              </>
            )}
          </Button>
        </div>

        {/* Month Navigator */}
        <Card>
          <CardContent className="flex items-center justify-between py-3 px-4">
            <Button variant="ghost" size="icon-sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-base font-semibold">
              {format(selectedDate, 'MMMM yyyy')}
            </h3>
            <Button variant="ghost" size="icon-sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Budget Overview */}
        {currentBudget ? (
          <FadeIn>
            <Card>
              <CardHeader>
                <CardTitle>Budget Overview</CardTitle>
                <CardDescription>
                  {formatCurrency(totalSpent)} of {formatCurrency(currentBudget.totalAmount)} spent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress
                  value={overallPercentage}
                  className={cn('h-3', {
                    '[&>div]:bg-green-500': overallPercentage < 75,
                    '[&>div]:bg-yellow-500': overallPercentage >= 75 && overallPercentage < 100,
                    '[&>div]:bg-red-500': overallPercentage >= 100,
                  })}
                />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{overallPercentage.toFixed(0)}% used</span>
                  <span
                    className={cn({
                      'text-green-600 dark:text-green-400': currentBudget.totalAmount - totalSpent > 0,
                      'text-red-600 dark:text-red-400': currentBudget.totalAmount - totalSpent < 0,
                    })}
                  >
                    {formatCurrency(Math.abs(currentBudget.totalAmount - totalSpent))}{' '}
                    {currentBudget.totalAmount - totalSpent >= 0 ? 'remaining' : 'over'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        ) : (
          <Card>
            <EmptyState
              icon={<Wallet className="h-10 w-10" />}
              title="No budget set"
              description={`Create a budget for ${format(selectedDate, 'MMMM yyyy')} to start tracking your spending.`}
              action={{
                label: 'Create Budget',
                onClick: openCreateDialog,
              }}
            />
          </Card>
        )}

        {/* Category Allocations */}
        {currentBudget && allocationsWithSpending.length > 0 && (
          <FadeIn>
            <Card>
              <CardHeader>
                <CardTitle>Category Budgets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {allocationsWithSpending.map((allocation) => (
                  <div key={allocation.categoryId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {allocation.category && (
                          <CategoryIcon
                            icon={allocation.category.icon}
                            color={allocation.category.color}
                            size="sm"
                          />
                        )}
                        <span className="font-medium">
                          {allocation.category?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={cn('font-medium', {
                            'text-destructive': allocation.spent > allocation.amount,
                          })}
                        >
                          {formatCurrency(allocation.spent)}
                        </span>
                        <span className="text-muted-foreground">
                          {' '}
                          / {formatCurrency(allocation.amount)}
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={allocation.percentage}
                      className={cn('h-2', {
                        '[&>div]:bg-green-500': allocation.percentage < 75,
                        '[&>div]:bg-yellow-500':
                          allocation.percentage >= 75 && allocation.percentage < 100,
                        '[&>div]:bg-red-500': allocation.percentage >= 100,
                      })}
                    />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {allocation.percentage.toFixed(0)}% used
                      </span>
                      <span
                        className={cn({
                          'text-green-600 dark:text-green-400': allocation.remaining > 0,
                          'text-red-600 dark:text-red-400': allocation.remaining < 0,
                          'text-muted-foreground': allocation.remaining === 0,
                        })}
                      >
                        {allocation.remaining >= 0
                          ? `${formatCurrency(allocation.remaining)} left`
                          : `${formatCurrency(Math.abs(allocation.remaining))} over`}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {/* Create/Edit Budget Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] flex flex-col sm:max-w-lg">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {currentBudget ? 'Edit' : 'Create'} Budget
              </DialogTitle>
              <DialogDescription>
                {format(selectedDate, 'MMMM yyyy')} - Set your budget and allocate to categories.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-5 py-2 -mx-6 px-6">
              {/* Total Budget */}
              <div className="space-y-2">
                <Label htmlFor="totalBudget">Total Monthly Budget</Label>
                <div className="relative">
                  <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2">
                    {symbol}
                  </span>
                  <Input
                    id="totalBudget"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7 text-lg h-12"
                    value={totalBudget || ''}
                    onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Category Allocations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Category Allocations</Label>
                  <span
                    className={cn('text-sm', {
                      'text-green-600 dark:text-green-400': totalAllocated <= totalBudget,
                      'text-red-600 dark:text-red-400': totalAllocated > totalBudget,
                    })}
                  >
                    {formatCurrency(totalAllocated)} / {formatCurrency(totalBudget)}
                  </span>
                </div>

                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center gap-2">
                      <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                      <span className="flex-1 text-sm font-medium truncate">{category.name}</span>
                      <div className="relative w-28">
                        <span className="text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 text-sm">
                          {symbol}
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          className="pl-6 h-10 text-right pr-3"
                          value={allocations[category.id] || ''}
                          onChange={(e) => handleAllocationChange(category.id, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button onClick={handleSaveBudget} disabled={isSaving} className="flex-1 sm:flex-none">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentBudget ? 'Update' : 'Create'} Budget
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
