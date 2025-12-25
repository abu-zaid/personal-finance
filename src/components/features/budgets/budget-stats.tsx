'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface BudgetStatsProps {
    categoriesOnTrack: number;
    categoriesOverBudget: number;
}

export const BudgetStats = React.memo(function BudgetStats({
    categoriesOnTrack,
    categoriesOverBudget
}: BudgetStatsProps) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-card">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mb-2">
                        <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-2xl font-bold">{categoriesOnTrack}</span>
                    <span className="text-xs text-muted-foreground">On Track</span>
                </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-card">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center mb-2">
                        <AlertTriangle className="h-4 w-4" />
                    </div>
                    <span className="text-2xl font-bold">{categoriesOverBudget}</span>
                    <span className="text-xs text-muted-foreground">Over Budget</span>
                </CardContent>
            </Card>
        </div>
    );
});
