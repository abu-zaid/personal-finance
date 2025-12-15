'use client';

import { useMemo, useState } from 'react';
import { format, subMonths } from 'date-fns';
import { PageTransition, FadeIn, AnimatedNumber } from '@/components/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
import { cn, getMonthString } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';
import { BarChart3, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function InsightsPage() {
  const { transactions, getMonthlyTotal } = useTransactions();
  const { categories } = useCategories();
  const { formatCurrency } = useCurrency();

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
        <div className="space-y-4">
          <div>
            <h1 className="text-h1 lg:text-2xl lg:font-bold">Insights</h1>
            <p className="text-muted-foreground text-sm">Understand your spending patterns</p>
          </div>
          <Card>
            <EmptyState
              icon={<BarChart3 className="h-10 w-10" />}
              title="No data yet"
              description="Add some transactions to see insights about your spending patterns and trends."
            />
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1 lg:text-2xl lg:font-bold">Insights</h1>
            <p className="text-muted-foreground text-sm">Understand your spending</p>
          </div>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as '3' | '6' | '12')}>
            <SelectTrigger className="w-[130px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 months</SelectItem>
              <SelectItem value="6">6 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          <FadeIn>
            <Card>
              <CardContent className="p-4">
                <p className="text-caption text-muted-foreground mb-1">This Month</p>
                <div className="text-h2 font-bold">
                  <AnimatedNumber value={currentMonthTotal} format="currency" />
                </div>
                <div className="mt-1 flex items-center text-caption">
                  {monthChange > 0 ? (
                    <>
                      <ArrowUpRight className="mr-1 h-3 w-3 text-destructive" />
                      <span className="text-destructive">
                        {monthChange.toFixed(0)}% more
                      </span>
                    </>
                  ) : monthChange < 0 ? (
                    <>
                      <ArrowDownRight className="mr-1 h-3 w-3 text-primary" />
                      <span className="text-primary">
                        {Math.abs(monthChange).toFixed(0)}% less
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
              <CardContent className="p-4">
                <p className="text-caption text-muted-foreground mb-1">Average</p>
                <div className="text-h2 font-bold">
                  <AnimatedNumber value={averageMonthlySpend} format="currency" />
                </div>
                <p className="text-muted-foreground mt-1 text-caption">
                  Last {timeRange} months
                </p>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn>
            <Card className="col-span-2 lg:col-span-1">
              <CardContent className="p-4">
                <p className="text-caption text-muted-foreground mb-1">Top Category</p>
                {topCategory ? (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <CategoryIcon
                        icon={topCategory.category.icon}
                        color={topCategory.category.color}
                        size="sm"
                      />
                      <span className="text-lg font-bold truncate">{topCategory.category.name}</span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-caption">
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
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Spending Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto px-4 sm:px-6 pb-4 scrollbar-thin">
                <div 
                  className="flex h-44 items-end gap-1.5 sm:gap-2"
                  style={{ 
                    width: timeRange === '12' ? '600px' : '100%',
                    minWidth: '100%',
                  }}
                >
                  {monthlyData.map((data) => (
                    <div
                      key={data.month}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <span className="text-muted-foreground text-[7px] sm:text-[9px] whitespace-nowrap">
                        {data.total > 0 ? formatCurrency(data.total) : '-'}
                      </span>
                      <div
                        className={cn(
                          'w-full max-w-[32px] sm:max-w-[40px] rounded-t-lg transition-all duration-300',
                          data.month === currentMonth ? 'bg-primary' : 'bg-primary/30 dark:bg-primary/40'
                        )}
                        style={{
                          height: `${Math.max((data.total / maxMonthlySpend) * 120, 4)}px`,
                        }}
                      />
                      <span className="text-[8px] sm:text-[10px] font-medium text-muted-foreground">{data.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Category Breakdown */}
        <FadeIn>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">By Category</CardTitle>
              <CardDescription className="text-caption">
                {format(new Date(), 'MMMM yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoryBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {categoryBreakdown.map((item) => {
                    const percentage = totalCurrentMonth > 0
                      ? (item.total / totalCurrentMonth) * 100
                      : 0;
                    return (
                      <div key={item.category.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="flex h-8 w-8 items-center justify-center rounded-xl"
                              style={{
                                background: `${item.category.color}15`,
                              }}
                            >
                              <CategoryIcon
                                icon={item.category.icon}
                                color={item.category.color}
                                size="sm"
                              />
                            </div>
                            <span className="text-sm font-medium">{item.category.name}</span>
                          </div>
                          <div className="text-right flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold">{formatCurrency(item.total)}</span>
                            <span className="text-muted-foreground/60 text-[10px] font-medium">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="bg-muted/50 dark:bg-white/[0.05] h-1.5 overflow-hidden rounded-full">
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
