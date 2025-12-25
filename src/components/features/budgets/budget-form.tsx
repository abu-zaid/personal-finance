'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/features/categories';

interface BudgetFormProps {
    totalBudget: number;
    setTotalBudget: (val: number) => void;
    allocations: Record<string, number>;
    setAllocations: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    categories: any[];
    symbol: string;
    formatCurrency: (val: number) => string;
}

export function BudgetForm({
    totalBudget,
    setTotalBudget,
    allocations,
    setAllocations,
    categories,
    symbol,
    formatCurrency,
}: BudgetFormProps) {

    const totalAllocated = Object.values(allocations).reduce((sum, amount) => sum + amount, 0);
    const unallocatedAmount = totalBudget - totalAllocated;

    const distributeEvenly = () => {
        if (totalBudget <= 0 || categories.length === 0) return;
        const amountPerCategory = Math.floor(totalBudget / categories.length);
        const newAllocations: Record<string, number> = {};
        categories.forEach((cat) => {
            newAllocations[cat.id] = amountPerCategory;
        });
        setAllocations(newAllocations);
    };

    const clearAllocations = () => {
        setAllocations({});
    };

    const handleAllocationChange = (categoryId: string, value: string) => {
        const amount = parseFloat(value) || 0;
        setAllocations((prev) => ({ ...prev, [categoryId]: amount }));
    };

    return (
        <div className="space-y-6">
            {/* Total Budget Input */}
            <div className="space-y-2">
                <Label htmlFor="totalBudget" className="text-sm font-medium">
                    Total Monthly Budget
                </Label>
                <div className="relative">
                    <span className="text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 text-base sm:text-lg font-medium">
                        {symbol}
                    </span>
                    <Input
                        id="totalBudget"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-9 text-xl sm:text-2xl font-bold h-12 sm:h-14 rounded-2xl bg-muted/30 border-transparent focus:border-primary/50 focus:bg-background transition-all"
                        value={totalBudget || ''}
                        onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                    />
                </div>
                {totalBudget > 0 && (
                    <p className="text-xs text-muted-foreground px-1">
                        Daily budget: ~{formatCurrency(totalBudget / 30)}
                    </p>
                )}
            </div>

            {/* Allocation Summary Bar */}
            {totalBudget > 0 && (
                <div className="p-4 rounded-2xl bg-muted/40 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Allocated</span>
                        <span
                            className={cn(
                                "font-semibold",
                                totalAllocated > totalBudget ? "text-destructive" : "text-foreground"
                            )}
                        >
                            {formatCurrency(totalAllocated)} / {formatCurrency(totalBudget)}
                        </span>
                    </div>
                    <Progress
                        value={totalBudget > 0 ? Math.min((totalAllocated / totalBudget) * 100, 100) : 0}
                        className={cn("h-2.5 rounded-full bg-background", {
                            "[&>div]:bg-primary": totalAllocated <= totalBudget,
                            "[&>div]:bg-destructive": totalAllocated > totalBudget,
                        })}
                    />
                    <div className="flex items-center justify-between text-xs pt-1">
                        <span
                            className={cn(
                                unallocatedAmount >= 0 ? "text-muted-foreground" : "text-destructive font-medium"
                            )}
                        >
                            {unallocatedAmount >= 0
                                ? `${formatCurrency(unallocatedAmount)} unallocated`
                                : `${formatCurrency(Math.abs(unallocatedAmount))} over-allocated`}
                        </span>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={distributeEvenly}
                                className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium"
                            >
                                <Sparkles className="h-3 w-3" />
                                Distribute
                            </button>
                            {Object.keys(allocations).length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearAllocations}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Category Allocations */}
            <div className="space-y-4">
                <div>
                    <Label className="text-sm font-medium">Category Allocations</Label>
                    <p className="text-xs text-muted-foreground">
                        Optional: Set limits for specific categories
                    </p>
                </div>

                <div className="space-y-3">
                    {categories.map((category) => {
                        const allocation = allocations[category.id] || 0;
                        const percentage = totalBudget > 0 ? (allocation / totalBudget) * 100 : 0;

                        return (
                            <div
                                key={category.id}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-2xl transition-all border border-transparent",
                                    allocation > 0 ? "bg-background shadow-sm border-border/40" : "bg-muted/20 hover:bg-muted/40"
                                )}
                            >
                                <div
                                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                                    style={{ backgroundColor: `${category.color}15` }}
                                >
                                    <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{category.name}</p>
                                    {allocation > 0 && totalBudget > 0 && (
                                        <p className="text-[10px] text-muted-foreground">
                                            {percentage.toFixed(0)}% of budget
                                        </p>
                                    )}
                                </div>

                                <div className="w-24 sm:w-32 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                                        {symbol}
                                    </span>
                                    <Input
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="0"
                                        className="h-9 pl-6 pr-2 text-right text-sm rounded-lg bg-transparent border-border/50 focus:bg-background"
                                        value={allocation || ''}
                                        onChange={(e) => handleAllocationChange(category.id, e.target.value)}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
