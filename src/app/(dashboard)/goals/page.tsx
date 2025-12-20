'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Target,
    Plus,
    Trash,
    Pencil,
    TrendUp,
    Flag,
    Rocket,
    Airplane,
    House,
    Car
} from 'phosphor-react';
import { toast } from 'sonner';
import {
    PageTransition,
    FadeIn,
    StaggerContainer,
    StaggerItem
} from '@/components/animations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCurrency } from '@/hooks/use-currency';
import { cn } from '@/lib/utils';
import { GoalModal } from '@/components/features/goals/goal-modal';

import { useGoals } from '@/context/goals-context';

const ICON_MAP: Record<string, any> = {
    Target,
    Rocket,
    Airplane,
    House,
    Car,
    Flag
};

export default function GoalsPage() {
    const { formatCurrency } = useCurrency();
    const { goals, isLoading, deleteGoal } = useGoals();

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<any>(null);

    const handleAddGoal = () => {
        setEditingGoal(null);
        setModalOpen(true);
    };

    const handleEditGoal = (goal: any) => {
        setEditingGoal(goal);
        setModalOpen(true);
    };

    const handleDeleteGoal = async (id: string) => {
        if (confirm('Are you sure you want to delete this goal?')) {
            try {
                await deleteGoal(id);
                toast.success('Goal deleted');
            } catch (err) {
                toast.error('Failed to delete goal');
            }
        }
    };

    // Sample goals data
    // const [goals, setGoals] = useState([
    //     {
    //         id: '1',
    //         name: 'Emergency Fund',
    //         targetAmount: 10000,
    //         currentAmount: 6500,
    //         icon: House,
    //         color: '#3B82F6', // Blue
    //         deadline: '2025-06-30',
    //     },
    //     {
    //         id: '2',
    //         name: 'New Laptop',
    //         targetAmount: 2500,
    //         currentAmount: 2100,
    //         icon: Rocket,
    //         color: '#98EF5A', // Primary
    //         deadline: '2025-02-15',
    //     },
    //     {
    //         id: '3',
    //         name: 'Summer Vacation',
    //         targetAmount: 5000,
    //         currentAmount: 1200,
    //         icon: Airplane,
    //         color: '#F59E0B', // Amber
    //         deadline: '2025-08-01',
    //     },
    //     {
    //         id: '4',
    //         name: 'Tesla Model 3',
    //         targetAmount: 45000,
    //         currentAmount: 5000,
    //         icon: Car,
    //         color: '#EF4444', // Red
    //         deadline: '2026-12-31',
    //     }
    // ]);

    const totalSaved = useMemo(() => {
        return goals.reduce((sum, g) => sum + g.current_amount, 0);
    }, [goals]);

    const totalTarget = useMemo(() => {
        return goals.reduce((sum, g) => sum + g.target_amount, 0);
    }, [goals]);

    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    const closestGoal = useMemo(() => {
        if (goals.length === 0) return null;

        // Find goal with highest percentage (that isn't completed)
        const activeDefaults = goals
            .filter(g => g.current_amount < g.target_amount)
            .sort((a, b) => {
                const aPct = a.current_amount / a.target_amount;
                const bPct = b.current_amount / b.target_amount;
                return bPct - aPct;
            });

        return activeDefaults[0] || null;
    }, [goals]);

    // Simple estimation: Assume standard monthly saving based on past progress or fixed amount if no history
    // For now, we'll estimate based on remaining amount relative to a 'typical' saving rate or just generic encouragement
    const motivationMessage = useMemo(() => {
        if (!closestGoal) return {
            title: "Start your savings journey today!",
            message: "Create your first goal to track your progress and achieve your dreams."
        };

        const remaining = closestGoal.target_amount - closestGoal.current_amount;
        // Mock monthly savings for motivation context - in a real app this would come from analytics
        const estimatedMonthlySavings = 500;
        const monthsLeft = Math.ceil(remaining / estimatedMonthlySavings);

        if (monthsLeft <= 1) {
            return {
                title: "You're almost there!",
                message: `You are so close to reaching your "${closestGoal.name}" goal. One final push! 🏁`
            };
        }

        return {
            title: `Keep it up!`,
            message: `At this rate, you could reach your "${closestGoal.name}" goal in about ${monthsLeft} months.`
        };
    }, [closestGoal]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>;
    }

    return (
        <PageTransition>
            <div className="space-y-6 pb-24">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Savings Goals</h1>
                        <p className="text-muted-foreground text-xs md:text-sm">Visualize your future. One step at a time.</p>
                    </div>
                    <Button
                        onClick={handleAddGoal}
                        className="rounded-xl h-10 md:h-11 px-4 md:px-6 shadow-lg shadow-primary/20 text-xs md:text-sm"
                    >
                        <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5" weight="bold" />
                        New Goal
                    </Button>
                </div>

                {/* Global Progress Card */}
                <FadeIn>
                    <Card className="bg-gradient-to-br from-[#101010] to-[#202020] text-white border-none shadow-xl">
                        <CardContent className="p-5 md:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary">Overall Progress</p>
                                    <p className="text-2xl md:text-3xl font-bold mt-1">
                                        {formatCurrency(totalSaved)}
                                        <span className="text-sm md:text-lg font-normal text-white/40 ml-1">/ {formatCurrency(totalTarget)}</span>
                                    </p>
                                </div>
                                <div className="h-10 w-10 md:h-14 md:w-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                    <TrendUp size={20} weight="bold" className="text-primary md:w-8 md:h-8" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-white/60">{overallProgress.toFixed(0)}% Completed</span>
                                    <span className="text-primary">{formatCurrency(totalTarget - totalSaved)} left</span>
                                </div>
                                <Progress value={overallProgress} className="h-2 md:h-2.5 bg-white/10" indicatorClassName="bg-primary shadow-[0_0_12px_rgba(152,239,90,0.5)]" />
                            </div>
                        </CardContent>
                    </Card>
                </FadeIn>

                {/* Goals Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                    <StaggerContainer className="contents">
                        {goals.length > 0 ? (
                            goals.map((goal) => {
                                const progress = (goal.current_amount / goal.target_amount) * 100;
                                const Icon = ICON_MAP[goal.icon] || ICON_MAP.Target;

                                return (
                                    <StaggerItem key={goal.id}>
                                        <Card className="overflow-hidden group h-full transition-all hover:border-primary/30">
                                            <CardContent className="p-5 flex flex-col h-full">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div
                                                        className="h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center shadow-inner"
                                                        style={{ backgroundColor: `${goal.color}15` }}
                                                    >
                                                        <Icon size={20} weight="bold" style={{ color: goal.color }} className="md:w-6 md:h-6" />
                                                    </div>
                                                    <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg"
                                                            onClick={() => handleEditGoal(goal)}
                                                        >
                                                            <Pencil size={16} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive rounded-lg"
                                                            onClick={() => handleDeleteGoal(goal.id)}
                                                        >
                                                            <Trash size={16} />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex-1">
                                                    <h3 className="font-bold text-base md:text-lg leading-tight truncate">{goal.name}</h3>
                                                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                        <Flag size={12} className="md:w-[14px] md:h-[14px]" />
                                                        Target: {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}
                                                    </p>
                                                </div>

                                                <div className="mt-6 space-y-3">
                                                    <div className="flex justify-between items-baseline">
                                                        <p className="text-lg md:text-xl font-bold">{formatCurrency(goal.current_amount)}</p>
                                                        <p className="text-[10px] md:text-xs text-muted-foreground font-medium">of {formatCurrency(goal.target_amount)}</p>
                                                    </div>
                                                    <Progress
                                                        value={progress}
                                                        className="h-2"
                                                        style={{ backgroundColor: `${goal.color}10` }}
                                                        indicatorStyle={{ backgroundColor: goal.color }}
                                                    />
                                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        <span>{progress.toFixed(0)}% Done</span>
                                                        <span style={{ color: goal.color }}>{formatCurrency(goal.target_amount - goal.current_amount)} To go</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </StaggerItem>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-12 text-center text-muted-foreground">
                                <p>No goals yet. Create one to start saving!</p>
                            </div>
                        )}
                    </StaggerContainer>
                </div>

                {/* Motivation Card */}
                {closestGoal && (
                    <FadeIn>
                        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 md:p-6 flex items-center gap-4 md:gap-5">
                            <div className="h-10 w-10 md:h-14 md:w-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                                <Target size={20} className="text-primary md:w-7 md:h-7" weight="bold" />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground text-sm md:text-base">{motivationMessage.title}</h4>
                                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                    {motivationMessage.message}
                                </p>
                            </div>
                        </div>
                    </FadeIn>
                )}

                <GoalModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    goal={editingGoal}
                />
            </div>
        </PageTransition>
    );
}
