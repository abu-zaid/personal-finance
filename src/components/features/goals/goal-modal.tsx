'use client';

import { useState, memo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Target,
    Rocket,
    Airplane,
    House,
    Car,
    Flag,
    Plus,
    Pencil
} from 'phosphor-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGoals } from '@/context/goals-context';
import { useCurrency } from '@/hooks/use-currency';
import { useHaptics } from '@/hooks/use-haptics';
import { goalSchema, GoalFormData } from '@/lib/validations';
import { cn } from '@/lib/utils';
import { Goal } from '@/types';

const ICONS = [
    { id: 'Target', icon: Target },
    { id: 'Rocket', icon: Rocket },
    { id: 'Airplane', icon: Airplane },
    { id: 'House', icon: House },
    { id: 'Car', icon: Car },
    { id: 'Flag', icon: Flag },
];

const COLORS = [
    '#98EF5A', // Primary
    '#3B82F6', // Blue
    '#A855F7', // Purple
    '#EC4899', // Pink
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
];

interface GoalModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    goal?: Goal | null;
}

export const GoalModal = memo(function GoalModal({
    open,
    onOpenChange,
    goal
}: GoalModalProps) {
    const { createGoal, updateGoal } = useGoals();
    const { symbol } = useCurrency();
    const haptics = useHaptics();
    const [isLoading, setIsLoading] = useState(false);

    const isEditMode = !!goal;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<GoalFormData>({
        resolver: zodResolver(goalSchema),
        defaultValues: {
            icon: 'Target',
            color: COLORS[0],
            current_amount: 0,
        },
    });

    useEffect(() => {
        if (open) {
            if (goal) {
                reset({
                    name: goal.name,
                    target_amount: goal.target_amount,
                    current_amount: goal.current_amount,
                    icon: goal.icon,
                    color: goal.color,
                    deadline: goal.deadline || undefined,
                });
            } else {
                reset({
                    name: '',
                    target_amount: undefined as any,
                    current_amount: 0,
                    icon: 'Target',
                    color: COLORS[0],
                    deadline: '',
                });
            }
        }
    }, [open, goal, reset]);

    const selectedIcon = watch('icon');
    const selectedColor = watch('color');

    const onSubmit = useCallback(async (data: GoalFormData) => {
        setIsLoading(true);
        try {
            const payload = {
                ...data,
                deadline: data.deadline || null
            };
            if (isEditMode && goal) {
                await updateGoal(goal.id, payload);
                haptics.success();
                toast.success('Goal updated successfully');
            } else {
                await createGoal(payload);
                haptics.success();
                toast.success('Goal created successfully');
            }
            onOpenChange(false);
        } catch (error) {
            haptics.error();
            toast.error(isEditMode ? 'Failed to update goal' : 'Failed to create goal');
        } finally {
            setIsLoading(false);
        }
    }, [createGoal, updateGoal, haptics, onOpenChange, isEditMode, goal]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[32px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isEditMode ? <Pencil weight="bold" /> : <Plus weight="bold" />}
                        {isEditMode ? 'Edit Goal' : 'New Savings Goal'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Update your progress or goal details' : 'Set a new financial milestone to track'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Goal Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. New Macbook Pro"
                            className="bg-muted/30 border-none h-12 rounded-xl"
                            {...register('name')}
                        />
                        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="target_amount">Target Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{symbol}</span>
                                <Input
                                    id="target_amount"
                                    type="number"
                                    placeholder="0"
                                    className="bg-muted/30 border-none h-12 pl-8 rounded-xl"
                                    {...register('target_amount', { valueAsNumber: true })}
                                />
                            </div>
                            {errors.target_amount && <p className="text-destructive text-xs">{errors.target_amount.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="current_amount">Already Saved</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{symbol}</span>
                                <Input
                                    id="current_amount"
                                    type="number"
                                    placeholder="0"
                                    className="bg-muted/30 border-none h-12 pl-8 rounded-xl"
                                    {...register('current_amount', { valueAsNumber: true })}
                                />
                            </div>
                            {errors.current_amount && <p className="text-destructive text-xs">{errors.current_amount.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Select Icon</Label>
                        <div className="flex flex-wrap gap-2">
                            {ICONS.map((item) => {
                                const Icon = item.icon;
                                const isSelected = selectedIcon === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setValue('icon', item.id)}
                                        className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                            isSelected
                                                ? "bg-primary text-primary-foreground shadow-lg"
                                                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <Icon size={20} weight={isSelected ? "bold" : "regular"} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Select Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map((color) => {
                                const isSelected = selectedColor === color;
                                return (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setValue('color', color)}
                                        className={cn(
                                            "h-8 w-8 rounded-full transition-all border-2",
                                            isSelected ? "border-white scale-110 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                                        )}
                                        style={{ backgroundColor: color }}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="deadline">Target Date (Optional)</Label>
                        <Input
                            id="deadline"
                            type="date"
                            className="bg-muted/30 border-none h-12 rounded-xl"
                            {...register('deadline')}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            className="flex-1 h-12 rounded-xl"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditMode ? 'Update Goal' : 'Create Goal'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
});
