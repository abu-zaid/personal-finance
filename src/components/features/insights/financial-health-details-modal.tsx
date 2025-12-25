'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FinancialHealthScore } from "@/types/summary";
import { cn } from "@/lib/utils";
import { Target, TrendingUp, Sparkles, AlertCircle, CheckCircle2, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useMediaQuery } from "@/hooks/use-media-query";

interface FinancialHealthDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: FinancialHealthScore | null;
}

export function FinancialHealthDetailsModal({
    isOpen,
    onClose,
    data
}: FinancialHealthDetailsModalProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (!data) return null;

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4 bg-muted/30 border-b">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            Financial Health Breakdown
                        </DialogTitle>
                        <DialogDescription>
                            A deeper look at your financial wellness score
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[80vh]">
                        <HealthDetailsContent data={data} />
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-xl gap-0 flex flex-col">
                <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
                    <SheetTitle className="flex items-center gap-2 text-xl">
                        Financial Health Breakdown
                    </SheetTitle>
                    <SheetDescription>
                        A deeper look at your financial wellness score
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                    <HealthDetailsContent data={data} className="pb-12" />
                </div>
            </SheetContent>
        </Sheet>
    );
}

function HealthDetailsContent({ data, className }: { data: FinancialHealthScore, className?: string }) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-yellow-500";
        return "text-red-500";
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return "bg-green-500/10";
        if (score >= 60) return "bg-yellow-500/10";
        return "bg-red-500/10";
    };

    const sections = [
        {
            title: "Savings Rate",
            score: data.savingsRate,
            icon: Sparkles,
            description: "Percentage of income saved",
            details: data.savingsRate >= 20
                ? "Great job! You're saving a healthy portion of your income."
                : "Aim to save at least 20% of your income for long-term health."
        },
        {
            title: "Budget Adherence",
            score: data.budgetAdherence,
            icon: Target,
            description: "Spending within budget limits",
            details: data.budgetAdherence >= 80
                ? "Excellent discipline! You're sticking to your budget."
                : "Watch your spending. You're frequently exceeding budget limits."
        },
        {
            title: "Spending Trend",
            score: data.spendingTrend,
            icon: TrendingDown,
            description: "Month-over-month spending stability",
            details: data.spendingTrend >= 50
                ? "Your spending is stable or decreasing compared to last month."
                : "Spending is trending upwards. Look for areas to cut back."
        }
    ];

    return (
        <div className={cn("p-6 space-y-8", className)}>
            {/* Overall Score Hero */}
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className={cn(
                    "w-32 h-32 rounded-full flex items-center justify-center border-8 border-muted relative",
                    getScoreBg(data.overall)
                )}>
                    <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-current border-r-current rotate-45 transform"
                        style={{ color: data.overall >= 80 ? '#22c55e' : data.overall >= 60 ? '#eab308' : '#ef4444' }} />
                    <div className="text-center z-10">
                        <span className={cn("text-4xl font-bold block", getScoreColor(data.overall))}>
                            {data.overall}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                            {data.status}
                        </span>
                    </div>
                </div>
                <p className="text-center text-muted-foreground max-w-sm text-sm">
                    Your overall score is calculated based on your savings rate, budget adherence, and spending trends.
                </p>
            </div>

            {/* Detailed Sections */}
            <div className="space-y-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-card rounded-xl border p-4 space-y-3">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <section.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">{section.title}</h4>
                                    <p className="text-xs text-muted-foreground">{section.description}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={cn("text-lg font-bold", getScoreColor(section.score))}>
                                    {section.score}
                                </span>
                                <span className="text-xs text-muted-foreground">/100</span>
                            </div>
                        </div>
                        <Progress value={section.score} className="h-2" />
                        <p className="text-sm text-muted-foreground pt-1">
                            {section.details}
                        </p>
                    </div>
                ))}
            </div>

            {/* Recommendations */}
            {data.recommendations.length > 0 && (
                <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                        Recommendations
                    </h4>
                    <div className="grid gap-3">
                        {data.recommendations.map((rec, i) => (
                            <div key={i} className="flex gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-muted-foreground">{rec}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
