'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

import { AnimatedNumber } from '@/components/animations';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardSummaryProps {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    todaySpending: number;
    dailyAllowance: number;
    symbol: string;
    hasBudget: boolean;
}

export function DashboardSummary({
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    todaySpending,
    dailyAllowance,
    symbol,
    hasBudget
}: DashboardSummaryProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
        >
            <div className="absolute inset-x-4 top-4 bottom-0 bg-primary/20 blur-xl rounded-full opacity-50" />
            <Card className="rounded-[2rem] border-none shadow-xl bg-card text-card-foreground overflow-hidden relative z-10 lg:h-[300px] flex flex-col justify-center">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full -ml-24 -mb-24 blur-2xl pointer-events-none" />

                <CardContent className="p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 h-full">
                    <div className="space-y-2 text-center lg:text-left z-10">
                        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Total Balance</p>
                        <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                            {symbol}<AnimatedNumber value={totalBalance} />
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            {monthlyIncome > monthlyExpense ? 'On track ' : 'Over budget '}
                            for this month
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full lg:w-auto min-w-[300px]">
                        <div className="bg-muted/50 rounded-2xl p-4 backdrop-blur-md border border-border/50 transition-colors hover:bg-muted/80">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-emerald-500/10 dark:bg-[#98EF5A]/10 p-2 rounded-full">
                                    <ArrowDownRight className="h-4 w-4 text-emerald-600 dark:text-[#98EF5A]" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">Income</span>
                            </div>
                            <p className="font-bold text-xl text-foreground">{symbol}{monthlyIncome.toLocaleString()}</p>
                        </div>
                        <div className="bg-muted/50 rounded-2xl p-4 backdrop-blur-md border border-border/50 transition-colors hover:bg-muted/80">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-red-500/10 p-2 rounded-full">
                                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">Expense</span>
                            </div>
                            <p className="font-bold text-xl text-foreground">{symbol}{monthlyExpense.toLocaleString()}</p>
                        </div>
                        {hasBudget && (
                            <div className="col-span-2 bg-gradient-to-br from-[#98EF5A]/10 to-[#3B82F6]/10 rounded-2xl p-4 backdrop-blur-md border border-[#98EF5A]/20 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-500/10 dark:bg-[#98EF5A]/10 p-2 rounded-full">
                                            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-[#98EF5A]" />
                                        </div>
                                        <span className="text-sm font-medium text-muted-foreground">Can Spend Today</span>
                                    </div>
                                    {todaySpending > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            Spent: {symbol}{todaySpending.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </span>
                                    )}
                                </div>
                                <p className={cn(
                                    "font-bold text-xl",
                                    dailyAllowance >= 0 ? "text-emerald-600 dark:text-[#98EF5A]" : "text-red-500"
                                )}>
                                    {symbol}{Math.abs(dailyAllowance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {dailyAllowance >= 0 ? 'Remaining for today' : 'Over daily budget'}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
