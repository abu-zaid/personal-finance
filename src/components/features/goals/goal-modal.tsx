'use client';

import { useState, memo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Target,
    Rocket,
    Plane,
    Home,
    Car,
    Flag,
    Plus,
    Edit2,
    Loader2,
    Calendar as CalendarIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from '@/components/ui/sheet';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGoals } from '@/context/goals-context';
import { useCurrency } from '@/hooks/use-currency';
import { useHaptics } from '@/hooks/use-haptics';
import { goalSchema, GoalFormData } from '@/lib/validations';
import { cn } from '@/lib/utils';
import { Goal } from '@/types';
import { useMediaQuery } from '@/hooks/use-media-query';
import { BRAND_GRADIENT } from '@/lib/constants';

const ICONS = [
    { id: 'Target', icon: Target },
    { id: 'Rocket', icon: Rocket },
    { id: 'Airplane', icon: Plane },
    { id: 'House', icon: Home },
    { id: 'Car', icon: Car },
    { id: 'Flag', icon: Flag },
];

const COLORS = [
    BRAND_GRADIENT.from, // Primary
    BRAND_GRADIENT.to,   // Blue
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
    const isDesktop = useMediaQuery("(min-width: 768px)");

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

    const FormContent = (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4 h-full flex flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-1">
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
                                    <Icon size={20} strokeWidth={isSelected ? 3 : 2} />
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

                <div className="space-y-2 flex flex-col">
                    <Label htmlFor="deadline">Target Date (Optional)</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal h-12 rounded-xl bg-muted/30 border-none",
                                    !watch('deadline') && "text-muted-foreground"
                                )}
                            >
                                {watch('deadline') ? (
                                    format(new Date(watch('deadline')!), "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={watch('deadline') ? new Date(watch('deadline')!) : undefined}
                                onSelect={(date) => setValue('deadline', date ? format(date, 'yyyy-MM-dd') : null as any, { shouldValidate: true })}
                                disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    {errors.deadline && <p className="text-destructive text-xs">{errors.deadline.message}</p>}
                </div>
            </div>

            <div className="flex gap-3 pt-2 mt-auto">
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
    );

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="sm:max-w-md rounded-[32px] p-6"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {isEditMode ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            {isEditMode ? 'Edit Goal' : 'New Savings Goal'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditMode ? 'Update your progress or goal details' : 'Set a new financial milestone to track'}
                        </DialogDescription>
                    </DialogHeader>
                    {FormContent}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="h-[85vh] max-h-[85vh] rounded-t-[2rem] p-6 gap-0 border-t-0 bg-background text-foreground shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] flex flex-col"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <SheetHeader className="mb-2">
                    <SheetTitle className="flex items-center gap-2">
                        {isEditMode ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {isEditMode ? 'Edit Goal' : 'New Savings Goal'}
                    </SheetTitle>
                    <SheetDescription>
                        {isEditMode ? 'Update your progress or goal details' : 'Set a new financial milestone to track'}
                    </SheetDescription>
                </SheetHeader>
                {FormContent}
            </SheetContent>
        </Sheet>
    );
});
