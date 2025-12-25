'use client';

import { PageTransition, FadeIn } from '@/components/animations';
import { EmptyState } from '@/components/shared';
import { Wallet } from 'lucide-react';
import { useBudgetsView } from '@/hooks/use-budgets-view';
import { BudgetsHeader } from '@/components/features/budgets/budgets-header';
import { MonthNavigator } from '@/components/features/budgets/month-navigator';
import { BudgetHero } from '@/components/features/budgets/budget-hero';
import { BudgetStats } from '@/components/features/budgets/budget-stats';
import { BudgetList } from '@/components/features/budgets/budget-list';
import { CreateBudgetDialog } from '@/components/features/budgets/create-budget-dialog';
import { BudgetSkeleton, CardSkeleton } from '@/components/skeletons/skeleton-loaders';
import { Skeleton } from '@/components/ui/skeleton';

export default function BudgetsPage() {
  const {
    currentBudget,
    categories,
    allocationsWithSpending,
    isLoading,
    selectedDate,
    isCurrentMonth,
    status, // budget status obj
    totalMonthSpent,
    overallRemaining,
    overallPercentage,
    categoriesOverBudget,
    categoriesOnTrack,
    budgetStatus,
    symbol,
    formatCurrency,
    dialogOpen,
    setDialogOpen,
    handlePrevMonth,
    handleNextMonth,
    handleSaveBudget
  } = useBudgetsView();

  return (
    <PageTransition>
      <div className="space-y-4 p-4 pb-32 md:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <BudgetsHeader
          isEditing={!!currentBudget}
          onAction={() => setDialogOpen(true)}
        />

        {/* Month Navigator */}
        <MonthNavigator
          date={selectedDate}
          isCurrentMonth={isCurrentMonth}
          onPrev={handlePrevMonth}
          onNext={handleNextMonth}
        />

        {isLoading ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            {/* Hero Card Skeleton */}
            <CardSkeleton />

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-32 w-full rounded-3xl" />
              <Skeleton className="h-32 w-full rounded-3xl" />
            </div>

            {/* Category List Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-40" />
              {Array.from({ length: 4 }).map((_, i) => (
                <BudgetSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : currentBudget ? (
          <>
            {/* Hero Card */}
            <FadeIn>
              <BudgetHero
                currentBudget={currentBudget}
                overallRemaining={overallRemaining}
                overallPercentage={overallPercentage}
                totalMonthSpent={totalMonthSpent}
                formatCurrency={formatCurrency}
                status={budgetStatus}
              />
            </FadeIn>

            {/* Stats Grid */}
            <BudgetStats
              categoriesOnTrack={categoriesOnTrack}
              categoriesOverBudget={categoriesOverBudget}
            />

            {/* Category List */}
            <BudgetList
              allocations={allocationsWithSpending}
              formatCurrency={formatCurrency}
              onAddAllocation={() => setDialogOpen(true)}
            />
          </>
        ) : (
          <div className="py-12">
            <EmptyState
              icon={<Wallet className="h-12 w-12 text-muted-foreground" />}
              title="No budget set"
              description={`Create a budget for ${formatCurrency(0).replace(/[0-9.,]/g, '')} to start tracking.`}
              action={{ label: "Create Budget", onClick: () => setDialogOpen(true) }}
            />
          </div>
        )}
      </div>

      {/* Create/Edit Budget Dialog */}
      <CreateBudgetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentBudget={currentBudget}
        selectedDate={selectedDate}
        categories={categories}
        symbol={symbol}
        formatCurrency={formatCurrency}
        onSave={handleSaveBudget}
      />
    </PageTransition>
  );
}
