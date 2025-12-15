'use client';

import { PageTransition, StaggerContainer, StaggerItem } from '@/components/animations';
import { useAuth } from '@/context/auth-context';
import { useCategories } from '@/context/categories-context';
import { useTransactions } from '@/context/transactions-context';
import { useBudgets } from '@/context/budgets-context';
import {
  BalanceCard,
  BudgetOverview,
  RecentTransactions,
  SpendingByCategory,
} from '@/components/features/dashboard';
import { getMonthString } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const { transactions, getMonthlyTotal } = useTransactions();
  const { getBudgetByMonth } = useBudgets();

  const currentMonth = getMonthString(new Date());

  // Get current month budget
  const currentMonthBudget = getBudgetByMonth(currentMonth);

  // Calculate spending by category for current month
  const currentMonthTransactions = transactions.filter((t) => {
    const transactionMonth = getMonthString(new Date(t.date));
    return transactionMonth === currentMonth;
  });

  const spendingByCategory = categories.map((category) => {
    const categoryTransactions = currentMonthTransactions.filter(
      (t) => t.categoryId === category.id
    );
    const amount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    return { categoryId: category.id, amount };
  });

  // Filter for display (only categories with spending)
  const spendingByCategoryFiltered = spendingByCategory.filter((item) => item.amount > 0);

  // Calculate total budget and spent
  const totalBudget = currentMonthBudget?.totalAmount ?? 0;
  const totalSpent = getMonthlyTotal(currentMonth);
  const budgetRemaining = Math.max(0, totalBudget - totalSpent);
  const budgetUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Welcome Message - Mobile */}
        <div className="lg:hidden">
          <p className="text-muted-foreground/60 text-[11px] font-medium uppercase tracking-wide">Good morning,</p>
          <h1 className="text-xl font-semibold text-foreground mt-0.5">
            {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
        </div>

        {/* Desktop Welcome */}
        <div className="hidden lg:block">
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}!
          </h2>
          <p className="text-muted-foreground/70 mt-1">
            Here&apos;s what&apos;s happening with your finances this month.
          </p>
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

        {/* Recent Transactions - Mobile First */}
        <StaggerItem>
          <RecentTransactions
            transactions={currentMonthTransactions}
            categories={categories}
            limit={5}
          />
        </StaggerItem>

        {/* Main Content Grid - Desktop */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Budget Overview */}
          <StaggerItem>
            <BudgetOverview
              budget={currentMonthBudget}
              categories={categories}
              spendingByCategory={spendingByCategory}
            />
          </StaggerItem>

          {/* Spending by Category */}
          <StaggerItem>
            <SpendingByCategory
              spending={spendingByCategoryFiltered}
              categories={categories}
              totalSpent={totalSpent}
            />
          </StaggerItem>
        </div>
      </div>
    </PageTransition>
  );
}
