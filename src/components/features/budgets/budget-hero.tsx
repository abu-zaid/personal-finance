'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FadeIn } from '@/components/animations';
import { BudgetWithSpending } from '@/types';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Stack, Group, Box } from '@/components/ui/layout';

interface BudgetHeroProps {
    currentBudget: BudgetWithSpending;
    overallRemaining: number;
    overallPercentage: number;
    totalMonthSpent: number;
    formatCurrency: (val: number) => string;
    status: {
        label: string;
        color: 'destructive' | 'warning' | 'success';
        icon: any;
    } | null;
}

export function BudgetHero({
    currentBudget,
    overallRemaining,
    overallPercentage,
    totalMonthSpent,
    formatCurrency,
    status
}: BudgetHeroProps) {
    if (!status) return null;

    const StatusIcon = status.icon;

    return (
        <FadeIn>
            <Box
                className={cn(
                    "relative overflow-hidden rounded-[2rem] p-6 shadow-xl",
                    "bg-gradient-to-br from-card via-card to-background",
                    "border-2",
                    overallPercentage >= 100
                        ? "border-destructive/50"
                        : overallPercentage >= 80
                            ? "border-amber-500/50"
                            : "border-primary/30"
                )}
            >
                <Box className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-primary/10 blur-3xl opacity-50" />
                <Box className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl opacity-40" />

                <Stack className="relative z-10" gap={6}>
                    <Group justify="between" align="start">
                        <Stack gap={1}>
                            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
                                {overallRemaining >= 0 ? 'Remaining Budget' : 'Over Budget'}
                            </p>
                            <h2 className={cn(
                                "text-4xl font-bold tracking-tight",
                                overallPercentage >= 100
                                    ? "text-destructive"
                                    : overallPercentage >= 80
                                        ? "text-amber-500"
                                        : "text-foreground"
                            )}>
                                {overallRemaining < 0 && '-'}{formatCurrency(Math.abs(overallRemaining))}
                            </h2>
                        </Stack>
                        <Group align="center" gap={2} className={cn(
                            "backdrop-blur-md px-3 py-1 rounded-full",
                            overallPercentage >= 100
                                ? "bg-destructive/10 text-destructive"
                                : overallPercentage >= 80
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-primary/10 text-primary"
                        )}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            <span className="text-xs font-bold">{Math.round(overallPercentage)}%</span>
                        </Group>
                    </Group>

                    <Stack gap={2}>
                        <Group justify="between" className="text-xs text-muted-foreground font-medium">
                            <span>{formatCurrency(totalMonthSpent)} spent</span>
                            <span>{formatCurrency(currentBudget.totalAmount)} limit</span>
                        </Group>
                        <Box className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(overallPercentage, 100)}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={cn(
                                    "h-full rounded-full shadow-sm",
                                    overallPercentage >= 100
                                        ? "bg-destructive"
                                        : overallPercentage >= 80
                                            ? "bg-amber-500"
                                            : "bg-primary"
                                )}
                            />
                        </Box>
                    </Stack>
                </Stack>
            </Box>
        </FadeIn>
    );
}
