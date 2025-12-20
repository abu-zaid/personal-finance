'use client';

import { useMemo, useState, useEffect } from 'react';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PageTransition, FadeIn } from '@/components/animations';
import { useAuth } from '@/context/auth-context';
import { useCategories } from '@/context/categories-context';
import { useTransactions } from '@/context/transactions-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardSkeleton } from '@/components/shared';
import {
  FinancialHealthScore,
  SmartInsights,
  QuickActions,
  BudgetOverview,
  SpendingByCategory,
  RecentTransactions,
} from '@/components/features/dashboard';
import { getMonthString, cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';
import { useBudgets } from '@/context/budgets-context';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { transactions, isLoading: transactionsLoading, getMonthlyIncome, getMonthlyExpenses } = useTransactions();
  const { getBudgetByMonth, isLoading: budgetsLoading } = useBudgets();
  const { formatCurrency } = useCurrency();

  const isDataLoading = categoriesLoading || transactionsLoading || budgetsLoading;

  const currentMonth = getMonthString(new Date());

  // Get current month data
  const currentMonthBudget = getBudgetByMonth(currentMonth);
  const totalIncome = getMonthlyIncome(currentMonth);
  const totalExpenses = getMonthlyExpenses(currentMonth);

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

  const spendingByCategoryFiltered = useMemo(() => {
    return spendingByCategory.filter((item) => item.amount > 0);
  }, [spendingByCategory]);

  // 30-day cash flow data
  const cashFlowData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dayTransactions = transactions.filter((t) =>
        isSameDay(new Date(t.date), date)
      );
      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      days.push({
        date,
        label: format(date, 'MMM d'),
        income,
        expenses,
        net: income - expenses,
      });
    }
    return days;
  }, [transactions]);

  const maxCashFlow = Math.max(...cashFlowData.map((d) => Math.max(d.income, d.expenses)), 1);
  const totalNet = cashFlowData.reduce((sum, d) => sum + d.net, 0);

  // Greeting
  const [greeting, setGreeting] = useState('Hello');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  if (isDataLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <PageTransition>
      <div className=\"space-y-6 px-4 md:px-0 pb-8\">
      {/* Welcome Header */}
      <div className=\"flex items-center justify-between\">
      <div>
        <p className=\"text-muted-foreground/60 text-xs font-medium uppercase tracking-wide\">{greeting},</p>
      <h1 className=\"text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent mt-1\">
      {user?.name?.split(' ')[0] || 'there'} 👋
    </h1>
          </div >
        </div >

    {/* Financial Health Score - Hero */ }
    < FadeIn >
    <FinancialHealthScore />
        </FadeIn >

    {/* Smart Insights */ }
    < FadeIn >
    <SmartInsights />
        </FadeIn >

    {/* 30-Day Cash Flow */ }
    < FadeIn >
    <Card className=\"border-border/40 shadow-sm hover:shadow-md transition-shadow\">
      < CardHeader className =\"pb-3\">
        < div className =\"flex items-center justify-between\">
          < CardTitle className =\"text-base font-semibold\">Cash Flow (30 Days)</CardTitle>
            < div className = {
              cn(
                \"flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-full\",
                totalNet >= 0 ?\"bg-green-500/10 text-green-600\" : \"bg-destructive/10 text-destructive\"
                )
}>
  { totalNet >= 0 ? <TrendingUp className=\"h-3.5 w-3.5\" /> : <TrendingDown className=\"h-3.5 w-3.5\" />}
{ formatCurrency(Math.abs(totalNet)) }
                </div >
              </div >
            </CardHeader >
  <CardContent>
    <div className=\"flex items-end justify-between gap-0.5 h-32\">
    {cashFlowData.map((day, index) => {
      const incomeHeight = day.income > 0 ? (day.income / maxCashFlow) * 100 : 0;
      const expenseHeight = day.expenses > 0 ? (day.expenses / maxCashFlow) * 100 : 0;

      return (
        <div key={index} className=\"flex-1 flex flex-col items-center gap-1 relative group\">
    <div className=\"w-full flex flex-col-reverse gap-0.5\" style={{ height: '100px' }}>
    {/* Income bar */}
    {day.income > 0 && (
      <motion.div
        className=\"w-full rounded-t-sm bg-green-500/70\"
    initial={{ height: 0 }}
    animate={{ height: `${incomeHeight}%` }}
    transition={{ delay: index * 0.01, duration: 0.3 }}
                          />
                        )}
    {/* Expense bar */}
    {day.expenses > 0 && (
      <motion.div
        className=\"w-full rounded-t-sm bg-destructive/70\"
    initial={{ height: 0 }}
    animate={{ height: `${expenseHeight}%` }}
    transition={{ delay: index * 0.01, duration: 0.3 }}
                          />
                        )}
  </div>
{/* Tooltip on hover */ }
<div className=\"opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 px-2 py-1 rounded-lg bg-popover border text-[10px] whitespace-nowrap z-10 transition-opacity\">
  < div className =\"flex items-center gap-1 text-green-600\">
    < ArrowDownRight className =\"h-3 w-3\" />
{ formatCurrency(day.income) }
                        </div >
  <div className=\"flex items-center gap-1 text-destructive\">
    < ArrowUpRight className =\"h-3 w-3\" />
{ formatCurrency(day.expenses) }
                        </div >
                      </div >
                    </div >
                  );
                })}
              </div >
  <div className=\"mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs\">
    < div className =\"flex items-center gap-4\">
      < div className =\"flex items-center gap-1.5\">
        < div className =\"w-3 h-3 rounded-sm bg-green-500/70\" />
          < span className =\"text-muted-foreground\">Income</span>
                  </div >
  <div className=\"flex items-center gap-1.5\">
    < div className =\"w-3 h-3 rounded-sm bg-destructive/70\" />
      < span className =\"text-muted-foreground\">Expenses</span>
                  </div >
                </div >
              </div >
            </CardContent >
          </Card >
        </FadeIn >

  {/* Quick Actions */ }
  < FadeIn >
  <QuickActions />
        </FadeIn >

  {/* Budget Overview */ }
  < FadeIn >
  <BudgetOverview
    budget={currentMonthBudget}
    categories={categories}
    spendingByCategory={spendingByCategory}
  />
        </FadeIn >

  {/* Spending by Category */ }
  < FadeIn >
  <SpendingByCategory
    spending={spendingByCategoryFiltered}
    categories={categories}
    totalSpent={totalExpenses}
  />
        </FadeIn >

  {/* Recent Transactions */ }
  < FadeIn >
  <RecentTransactions
    transactions={currentMonthTransactions}
    categories={categories}
    limit={5}
  />
        </FadeIn >
      </div >
    </PageTransition >
  );
}
