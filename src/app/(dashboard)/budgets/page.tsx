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
import { Stack, Grid, Box } from '@/components/ui/layout';

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
      <Stack className="p-4 pb-32 md:p-6 lg:p-8 max-w-4xl mx-auto" gap={4}>
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
          <Stack className="animate-in fade-in zoom-in-95 duration-300" gap={4}>
            {/* Hero Card Skeleton */}
            <CardSkeleton />

            {/* Stats Grid Skeleton */}
            <Grid cols={2} gap={3}>
              <Skeleton className="h-32 w-full rounded-3xl" />
              <Skeleton className="h-32 w-full rounded-3xl" />
            </Grid>

            {/* Category List Skeleton */}
            <Stack gap={3}>
              <Skeleton className="h-5 w-40" />
              {Array.from({ length: 4 }).map((_, i) => (
                <BudgetSkeleton key={i} />
              ))}
            </Stack>
          </Stack>
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
          <Box className="py-12">
            <EmptyState
              icon={<Wallet className="h-12 w-12 text-muted-foreground" />}
              title="No budget set"
              description={`Create a budget for ${formatCurrency(0).replace(/[0-9.,]/g, '')} to start tracking.`}
              action={{ label: "Create Budget", onClick: () => setDialogOpen(true) }}
            />
          </Box>
        )}
      </Stack>

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
