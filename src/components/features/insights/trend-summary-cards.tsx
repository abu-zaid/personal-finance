'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { AnimatedNumber } from '@/components/animations';

interface TrendSummaryCardsProps {
    sixMonthAverage: number;
    highestMonth: { label: string; value: number } | null;
    currentMonthTotal: number;
    formatCurrency: (value: number) => string;
}

export function TrendSummaryCards({
    sixMonthAverage,
    highestMonth,
    currentMonthTotal,
    formatCurrency,
}: TrendSummaryCardsProps) {

    const percentDiffFromAvg = sixMonthAverage > 0
        ? ((currentMonthTotal - sixMonthAverage) / sixMonthAverage) * 100
        : 0;

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card>
                <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-blue-500/10">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">6 Mo Average</span>
                    </div>
                    <div className="text-xl font-bold">
                        <AnimatedNumber value={sixMonthAverage} format="currency" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        per month
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-orange-500/10">
                            <Calendar className="h-4 w-4 text-orange-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Highest Month</span>
                    </div>
                    <div className="text-xl font-bold">
                        {highestMonth ? formatCurrency(highestMonth.value) : '-'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {highestMonth ? highestMonth.label : 'No data'}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-purple-500/10">
                            <TrendingDown className="h-4 w-4 text-purple-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vs Average</span>
                    </div>
                    <div className="flex items-center">
                        <div className="text-xl font-bold">
                            {Math.abs(percentDiffFromAvg).toFixed(1)}%
                        </div>
                        {percentDiffFromAvg > 0 ? (
                            <ArrowUpRight className="ml-1 h-5 w-5 text-destructive" />
                        ) : (
                            <ArrowDownRight className="ml-1 h-5 w-5 text-primary" />
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {percentDiffFromAvg > 0 ? 'higher' : 'lower'} than average
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
