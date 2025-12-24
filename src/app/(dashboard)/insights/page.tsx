'use client';

import { useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    Target,
    Activity,
    PieChart as PieChartIcon,
    BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CardSkeleton, ChartSkeleton } from '@/components/skeletons/skeleton-loaders';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/animations';
import { CategoryIcon } from '@/components/features/categories';
import { useInsightsData } from '@/hooks/use-insights-data';
import { useFinancialHealth } from '@/hooks/use-financial-health';
import { useSmartInsights } from '@/hooks/use-smart-insights';
import { cn } from '@/lib/utils';

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
        dailyAverage,
        projectedTotal,
        sixMonthAverage,
        isLoading,
    } = useInsightsData();

    const { overall: healthScore, status: healthStatus, savingsRate: savingsRateScore, budgetAdherence } = useFinancialHealth();
    const insights = useSmartInsights();

    if (isLoading) {
        return (
            <PageTransition className="min-h-screen bg-background pb-24 lg:pb-8">
                <div className="max-w-md lg:max-w-7xl mx-auto px-4 lg:px-8 space-y-6">
                    {/* Header Skeleton */}
                    <div className="pt-6 space-y-2">
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="h-4 w-64" />
                    </div>

                    {/* Monthly Analysis Skeleton */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <CardSkeleton key={i} />
                        ))}
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                        {/* Category Breakdown Skeleton */}
                        <div className="md:col-span-1 lg:col-span-3">
                            <ChartSkeleton />
                        </div>

                        {/* History Chart Skeleton */}
                        <div className="md:col-span-1 lg:col-span-4">
                            <ChartSkeleton />
                        </div>
                    </div>
                </div>
            </PageTransition>
        );
    }

    // Empty state
    if (transactions.length === 0) {
        return (
            <PageTransition className="min-h-screen bg-background pb-24 lg:pb-8">
                <div className="max-w-md lg:max-w-7xl mx-auto px-4 lg:px-8 pt-6">
                    <h1 className="text-3xl font-bold tracking-tight mb-6">Insights</h1>
                    <Card className="rounded-2xl border-none shadow-sm">
                        <CardContent className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <BarChart3 className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No data yet</h3>
                            <p className="text-muted-foreground text-sm text-center max-w-sm">
                                Add some transactions to see insights about your spending patterns and trends.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </PageTransition>
        );
    }

    // Top 3 categories with percentage
    const topCategories = useMemo(() => {
        const total = categoryBreakdown.reduce((sum, item) => sum + item.total, 0);
        return categoryBreakdown
            .filter(c => c.total > 0)
            .sort((a, b) => b.total - a.total)
            .slice(0, 3)
            .map(item => ({
                ...item,
                percentage: total > 0 ? (item.total / total) * 100 : 0
            }));
    }, [categoryBreakdown]);

    // Get health color
    const getHealthColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getHealthBgColor = (score: number) => {
        if (score >= 80) return 'bg-green-500/10';
        if (score >= 60) return 'bg-yellow-500/10';
        return 'bg-red-500/10';
    };

    return (
        <PageTransition className="min-h-screen bg-background pb-24 lg:pb-8">
            <div className="max-w-md lg:max-w-7xl mx-auto px-4 lg:px-8 space-y-6">
                {/* Header */}
                <div className="pt-6">
                    <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Your financial overview and spending analysis
                    </p>
                </div>

                {/* Financial Health Score */}
                <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-card via-card to-primary/5">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Financial Health Score</p>
                                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{healthStatus}</p>
                            </div>
                            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", getHealthBgColor(healthScore))}>
                                <Activity className={cn("h-6 w-6", getHealthColor(healthScore))} />
                            </div>
                        </div>
                        <div className="flex items-end gap-3 mb-3">
                            <span className={cn("text-5xl font-bold tabular-nums", getHealthColor(healthScore))}>
                                {healthScore}
                            </span>
                            <span className="text-2xl text-muted-foreground mb-2">/100</span>
                        </div>
                        <Progress value={healthScore} className="h-2" />

                        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/40">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Savings Score</p>
                                <p className="text-lg font-bold">{savingsRateScore}/100</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Budget Score</p>
                                <p className="text-lg font-bold">{budgetAdherence}/100</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Current Month Spending */}
                    <Card className="rounded-2xl border-none shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <DollarSign className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">This Month</span>
                            </div>
                            <p className="text-2xl font-bold tabular-nums mb-1">
                                {formatCurrency(currentMonthTotal)}
                            </p>
                            {monthChange !== 0 && (
                                <div className="flex items-center gap-1">
                                    {monthChange > 0 ? (
                                        <TrendingUp className="h-3 w-3 text-red-500" />
                                    ) : (
                                        <TrendingDown className="h-3 w-3 text-green-500" />
                                    )}
                                    <span className={cn(
                                        "text-xs font-medium",
                                        monthChange > 0 ? "text-red-500" : "text-green-500"
                                    )}>
                                        {Math.abs(monthChange).toFixed(1)}%
                                    </span>
                                    <span className="text-xs text-muted-foreground">vs last month</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Daily Average */}
                    <Card className="rounded-2xl border-none shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">Daily Avg</span>
                            </div>
                            <p className="text-2xl font-bold tabular-nums">
                                {formatCurrency(dailyAverage)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Per day spending</p>
                        </CardContent>
                    </Card>

                    {/* Projected Total */}
                    <Card className="rounded-2xl border-none shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-purple-500" />
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">Projected</span>
                            </div>
                            <p className="text-2xl font-bold tabular-nums">
                                {formatCurrency(projectedTotal)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">End of month</p>
                        </CardContent>
                    </Card>

                    {/* 6-Month Average */}
                    <Card className="rounded-2xl border-none shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                    <Activity className="h-4 w-4 text-orange-500" />
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">6-Mo Avg</span>
                            </div>
                            <p className="text-2xl font-bold tabular-nums">
                                {formatCurrency(sixMonthAverage)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Average spending</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Budget Progress */}
                {currentBudget && (
                    <Card className="rounded-2xl border-none shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold">Budget Progress</CardTitle>
                                <Badge variant={budgetUsage > 100 ? "destructive" : budgetUsage > 80 ? "secondary" : "default"}>
                                    {budgetUsage.toFixed(0)}%
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Progress value={Math.min(budgetUsage, 100)} className="h-3" />
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Budget</p>
                                    <p className="text-sm font-bold">{formatCurrency(currentBudget.totalAmount)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Spent</p>
                                    <p className="text-sm font-bold">{formatCurrency(currentMonthTotal)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                                    <p className={cn(
                                        "text-sm font-bold",
                                        budgetRemaining < 0 ? "text-red-500" : "text-green-500"
                                    )}>
                                        {formatCurrency(Math.abs(budgetRemaining))}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Top Categories */}
                <Card className="rounded-2xl border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5" />
                            Top Spending Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {topCategories.map((item) => (
                            <div key={item.category.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-10 w-10 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${item.category.color}20` }}
                                        >
                                            <CategoryIcon
                                                icon={item.category.icon}
                                                color={item.category.color}
                                                size="sm"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{item.category.name}</p>
                                            <p className="text-xs text-muted-foreground">{item.count} transactions</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold tabular-nums">{formatCurrency(item.total)}</p>
                                        <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                                    </div>
                                </div>
                                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-full transition-all"
                                        style={{
                                            width: `${item.percentage}%`,
                                            backgroundColor: item.category.color
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        {topCategories.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No spending data available
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Smart Insights */}
                {insights.length > 0 && (
                    <Card className="rounded-2xl border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Smart Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {insights.map((insight, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "p-4 rounded-xl border",
                                        insight.type === 'warning' && "bg-amber-500/5 border-amber-500/20",
                                        insight.type === 'achievement' && "bg-green-500/5 border-green-500/20",
                                        insight.type === 'opportunity' && "bg-blue-500/5 border-blue-500/20",
                                        insight.type === 'tip' && "bg-purple-500/5 border-purple-500/20"
                                    )}
                                >
                                    <p className="font-semibold text-sm mb-1">{insight.title}</p>
                                    <p className="text-xs text-muted-foreground">{insight.message}</p>
                                    {insight.impact && (
                                        <p className="text-xs text-primary mt-2 font-medium">{insight.impact}</p>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Monthly Trend */}
                <Card className="rounded-2xl border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            6-Month Spending Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {monthlyTrendData.map((month, index) => {
                                const maxValue = Math.max(...monthlyTrendData.map(m => m.value));
                                const percentage = maxValue > 0 ? (month.value / maxValue) * 100 : 0;

                                return (
                                    <div key={index} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">{month.label}</span>
                                            <span className="font-bold tabular-nums">{formatCurrency(month.value)}</span>
                                        </div>
                                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageTransition>
    );
}
