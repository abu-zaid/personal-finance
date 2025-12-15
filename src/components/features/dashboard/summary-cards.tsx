'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedNumber } from '@/components/animations';
import { cn, formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  format?: 'currency' | 'number' | 'percent';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  icon: React.ReactNode;
  className?: string;
}

function StatCard({
  title,
  value,
  format = 'currency',
  trend,
  trendValue,
  icon,
  className,
}: StatCardProps) {
  const formattedValue = format === 'currency' ? formatCurrency(value) : value.toLocaleString();

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground h-4 w-4">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {format === 'currency' ? (
            <AnimatedNumber value={value} format="currency" />
          ) : format === 'percent' ? (
            <AnimatedNumber value={value} format="percentage" />
          ) : (
            <AnimatedNumber value={value} format="number" />
          )}
        </div>
        {trend && trendValue !== undefined && (
          <p
            className={cn('text-xs', {
              'text-green-600 dark:text-green-400': trend === 'up',
              'text-red-600 dark:text-red-400': trend === 'down',
              'text-muted-foreground': trend === 'neutral',
            })}
          >
            <span className="inline-flex items-center gap-1">
              {trend === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : trend === 'down' ? (
                <TrendingDown className="h-3 w-3" />
              ) : null}
              {trendValue > 0 ? '+' : ''}
              {trendValue.toFixed(1)}% from last month
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface SummaryCardsProps {
  totalSpent: number;
  budgetRemaining: number;
  totalBudget: number;
  transactionCount: number;
  budgetUsagePercent: number;
}

export function SummaryCards({
  totalSpent,
  budgetRemaining,
  totalBudget,
  transactionCount,
  budgetUsagePercent,
}: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Spent"
        value={totalSpent}
        format="currency"
        icon={<Wallet className="h-4 w-4" />}
      />
      <StatCard
        title="Budget Remaining"
        value={budgetRemaining}
        format="currency"
        icon={<Target className="h-4 w-4" />}
        trend={budgetRemaining > 0 ? 'up' : 'down'}
        trendValue={budgetRemaining > 0 ? (budgetRemaining / totalBudget) * 100 : 0}
      />
      <StatCard
        title="Budget Used"
        value={budgetUsagePercent}
        format="percent"
        icon={
          <div className="relative h-4 w-4">
            <svg className="h-4 w-4" viewBox="0 0 16 16">
              <circle
                className="text-muted"
                strokeWidth="2"
                stroke="currentColor"
                fill="transparent"
                r="6"
                cx="8"
                cy="8"
              />
              <circle
                className={cn({
                  'text-green-500': budgetUsagePercent < 75,
                  'text-yellow-500': budgetUsagePercent >= 75 && budgetUsagePercent < 90,
                  'text-red-500': budgetUsagePercent >= 90,
                })}
                strokeWidth="2"
                strokeDasharray={`${(budgetUsagePercent / 100) * 37.7} 37.7`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="6"
                cx="8"
                cy="8"
                transform="rotate(-90 8 8)"
              />
            </svg>
          </div>
        }
      />
      <StatCard
        title="Transactions"
        value={transactionCount}
        format="number"
        icon={
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        }
      />
    </div>
  );
}
