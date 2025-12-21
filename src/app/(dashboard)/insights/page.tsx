'use client';

import { BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/shared';
import { PageTransition, FadeIn } from '@/components/animations';
import { useInsightsData } from '@/hooks/use-insights-data';

import { InsightsHeader } from '@/components/features/insights/insights-header';
import { HealthScoreCard } from '@/components/features/insights/health-score-card';
import { MetricCards } from '@/components/features/insights/metric-cards';
import { SpendingTrend } from '@/components/features/insights/spending-trend';
import { CategoryAnalysis } from '@/components/features/insights/category-analysis';
import { BudgetOverview } from '@/components/features/insights/budget-overview';
import { DailySpendingAnalysis } from '@/components/features/insights/daily-spending-analysis';
import { SmartInsightsSection } from '@/components/features/insights/smart-insights-section';
import { TrendSummaryCards } from '@/components/features/insights/trend-summary-cards';
import { WeeklySpendingAnalysis } from '@/components/features/insights/weekly-spending-analysis';

export default function InsightsPage() {
  const {
    transactions,
    currentMonthTotal,
    monthChange,
    monthlyTrendData,
    formatCurrency,
    categoryBreakdown,
    currentBudget,
    budgetUsage,
    budgetRemaining,
    dailySpendingData,
    weeklySpendingData,
    sixMonthAverage,
    highestMonth,
    healthScore,
    dailyAverage,
    projectedTotal,
    totalCurrentMonth,
  } = useInsightsData();

  if (transactions.length === 0) {
    return (
      <PageTransition>
        <div className="space-y-6 p-4 pb-24 md:p-6 lg:p-8">
          <InsightsHeader />
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
      <div className="space-y-6 p-4 pb-24 md:p-6 lg:p-8">
        <InsightsHeader />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <FadeIn>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
                <div className="lg:col-span-7 space-y-6">
                  <HealthScoreCard score={healthScore} />
                  <MetricCards
                    currentMonthTotal={currentMonthTotal}
                    monthChange={monthChange}
                    dailyAverage={dailyAverage}
                    transactionCount={transactions.length}
                    projectedTotal={projectedTotal}
                    activeCategoriesCount={categoryBreakdown.length}
                  />
                  <BudgetOverview
                    currentBudget={currentBudget}
                    budgetUsage={budgetUsage}
                    budgetRemaining={budgetRemaining}
                    currentMonthTotal={currentMonthTotal}
                    formatCurrency={formatCurrency}
                  />
                </div>
                <div className="lg:col-span-5 space-y-6">
                  <SmartInsightsSection />
                </div>
              </div>
            </FadeIn>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6 mt-6">
            <FadeIn>
              <div className="space-y-6">
                <TrendSummaryCards
                  sixMonthAverage={sixMonthAverage}
                  highestMonth={highestMonth}
                  currentMonthTotal={currentMonthTotal}
                  formatCurrency={formatCurrency}
                />
              </div>
            </FadeIn>
          </TabsContent>

          <TabsContent value="details" className="space-y-6 mt-6">
            <FadeIn>
              <div className="grid gap-6 md:grid-cols-2">
                <CategoryAnalysis
                  data={categoryBreakdown}
                  totalCurrentMonth={totalCurrentMonth}
                  formatCurrency={formatCurrency}
                />
                {/* Can add more detailed budget breakdown here if needed */}
              </div>
            </FadeIn>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
