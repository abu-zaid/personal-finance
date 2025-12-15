'use client';

import { useMemo, useState } from 'react';
import { format, subMonths } from 'date-fns';
import { PageTransition, FadeIn, AnimatedNumber } from '@/components/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared';
import { CategoryIcon } from '@/components/features/categories';
import { useTransactions } from '@/context/transactions-context';
import { useCategories } from '@/context/categories-context';
import { cn, formatCurrency, getMonthString, getMonthDisplayName } from '@/lib/utils';
import { BarChart3, TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function InsightsPage() {
  const { transactions, getMonthlyTotal } = useTransactions();
  const { categories } = useCategories();

  const [timeRange, setTimeRange] = useState<'3' | '6' | '12'>('6');

  // Generate months for the time range
  const months = useMemo(() => {
    const result: string[] = [];
    const now = new Date();
    for (let i = 0; i < parseInt(timeRange); i++) {
      const date = subMonths(now, i);
      result.push(getMonthString(date));
    }
    return result.reverse();
  }, [timeRange]);

  // Monthly spending data
  const monthlyData = useMemo(() => {
    return months.map((month) => ({
      month,
      label: format(new Date(month + '-01'), 'MMM'),
      total: getMonthlyTotal(month),
    }));
  }, [months, getMonthlyTotal]);

  // Calculate max for scaling bars
  const maxMonthlySpend = Math.max(...monthlyData.map((d) => d.total), 1);

  // Category breakdown for current month
  const currentMonth = getMonthString(new Date());
  const categoryBreakdown = useMemo(() => {
    const currentMonthTransactions = transactions.filter((t) => {
      const transactionMonth = getMonthString(new Date(t.date));
      return transactionMonth === currentMonth;
    });

    const breakdown = categories.map((category) => {
      const categoryTransactions = currentMonthTransactions.filter(
        (t) => t.categoryId === category.id
      );
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      return { category, total, count: categoryTransactions.length };
    });

    return breakdown
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [transactions, categories, currentMonth]);

  const totalCurrentMonth = categoryBreakdown.reduce((sum, item) => sum + item.total, 0);

  // Calculate month-over-month change
  const previousMonth = getMonthString(subMonths(new Date(), 1));
  const previousMonthTotal = getMonthlyTotal(previousMonth);
  const currentMonthTotal = getMonthlyTotal(currentMonth);
  const monthChange = previousMonthTotal > 0
    ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
    : 0;

  // Average spending
  const averageMonthlySpend = useMemo(() => {
    const totalSpend = monthlyData.reduce((sum, d) => sum + d.total, 0);
    return totalSpend / monthlyData.length || 0;
  }, [monthlyData]);

  // Top spending category
  const topCategory = categoryBreakdown[0];

  if (transactions.length === 0) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Insights</h2>
            <p className="text-muted-foreground">Understand your spending patterns</p>
          </div>
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<BarChart3 className="h-12 w-12" />}
                title="Not enough data"
                description="Add some transactions to see insights about your spending patterns."
              />
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Insights</h2>
            <p className="text-muted-foreground">Understand your spending patterns</p>
          </div>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as '3' | '6' | '12')}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <FadeIn>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedNumber value={currentMonthTotal} format="currency" />
                </div>
                <div className="mt-1 flex items-center text-xs">
                  {monthChange > 0 ? (
                    <>
                      <ArrowUpRight className="mr-1 h-3 w-3 text-red-500" />
                      <span className="text-red-500">
                        {monthChange.toFixed(1)}% more than last month
                      </span>
                    </>
                  ) : monthChange < 0 ? (
                    <>
                      <ArrowDownRight className="mr-1 h-3 w-3 text-green-500" />
                      <span className="text-green-500">
                        {Math.abs(monthChange).toFixed(1)}% less than last month
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Same as last month</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  Monthly Average
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedNumber value={averageMonthlySpend} format="currency" />
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Over the last {timeRange} months
                </p>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  Top Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topCategory ? (
                  <>
                    <div className="flex items-center gap-2">
                      <CategoryIcon
                        icon={topCategory.category.icon}
                        color={topCategory.category.color}
                        size="sm"
                      />
                      <span className="text-xl font-bold">{topCategory.category.name}</span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatCurrency(topCategory.total)} this month
                    </p>
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm">No data</span>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Monthly Spending Chart */}
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending</CardTitle>
              <CardDescription>Your spending over the last {timeRange} months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-end gap-2">
                {monthlyData.map((data) => (
                  <div
                    key={data.month}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <span className="text-muted-foreground text-xs">
                      {formatCurrency(data.total)}
                    </span>
                    <div
                      className={cn(
                        'bg-primary/80 hover:bg-primary w-full rounded-t-md transition-all',
                        data.month === currentMonth && 'bg-primary'
                      )}
                      style={{
                        height: `${Math.max((data.total / maxMonthlySpend) * 180, 4)}px`,
                      }}
                    />
                    <span className="text-xs font-medium">{data.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Category Breakdown */}
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>
                {format(new Date(), 'MMMM yyyy')} breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoryBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {categoryBreakdown.map((item) => {
                    const percentage = totalCurrentMonth > 0
                      ? (item.total / totalCurrentMonth) * 100
                      : 0;
                    return (
                      <div key={item.category.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CategoryIcon
                              icon={item.category.icon}
                              color={item.category.color}
                              size="sm"
                            />
                            <span className="font-medium">{item.category.name}</span>
                            <span className="text-muted-foreground text-sm">
                              ({item.count} transaction{item.count !== 1 ? 's' : ''})
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">{formatCurrency(item.total)}</span>
                            <span className="text-muted-foreground ml-2 text-sm">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="bg-muted h-2 overflow-hidden rounded-full">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: item.category.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  No spending data for this month
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
