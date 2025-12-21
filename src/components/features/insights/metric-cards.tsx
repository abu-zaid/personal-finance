'use client';

import {
    Wallet,
    Calendar,
    Activity,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    Minus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedNumber } from '@/components/animations';

interface MetricCardsProps {
    currentMonthTotal: number;
    monthChange: number;
    dailyAverage: number;
    transactionCount: number;
    projectedTotal: number;
    activeCategoriesCount: number;
}

export function MetricCards({
    currentMonthTotal,
    monthChange,
    dailyAverage,
    transactionCount,
    projectedTotal,
    activeCategoriesCount,
}: MetricCardsProps) {

    const getChangeContent = (change: number) => {
        if (change > 0) {
            return (
                <>
                    <ArrowUpRight className="mr-1 h-3 w-3 text-destructive" />
                    <span className="text-destructive font-medium">{Math.abs(change).toFixed(0)}%</span>
                </>
            );
        }
        if (change < 0) {
            return (
                <>
                    <ArrowDownRight className="mr-1 h-3 w-3 text-primary" />
                    <span className="text-primary font-medium">{Math.abs(change).toFixed(0)}%</span>
                </>
            );
        }
        return (
            <>
                <Minus className="mr-1 h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground font-medium">0%</span>
            </>
        );
    };

    return (
        <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
            <Card>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Wallet className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Spent</span>
                    </div>
                    <div className="text-2xl font-bold">
                        <AnimatedNumber value={currentMonthTotal} format="currency" />
                    </div>
                    <div className="mt-2 flex items-center text-xs">
                        {getChangeContent(monthChange)}
                        <span className="text-muted-foreground ml-2">vs last month</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Calendar className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Daily Avg</span>
                    </div>
                    <div className="text-2xl font-bold">
                        <AnimatedNumber value={dailyAverage} format="currency" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        accross {transactionCount} transactions
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <Activity className="h-4 w-4 text-purple-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projected</span>
                    </div>
                    <div className="text-2xl font-bold">
                        <AnimatedNumber value={projectedTotal} format="currency" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        estimated by month end
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                            <Target className="h-4 w-4 text-orange-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Categories</span>
                    </div>
                    <div className="text-2xl font-bold">
                        {activeCategoriesCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        active categories this month
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
