'use client';

import { useState, memo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    ArrowsClockwise,
    Calendar,
    Plus,
    Pencil
} from 'phosphor-react';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useRecurring } from '@/context/recurring-context';
import { useCategories } from '@/context/categories-context';
import { useCurrency } from '@/hooks/use-currency';
import { useHaptics } from '@/hooks/use-haptics';
import { recurringSchema, RecurringFormData } from '@/lib/validations';
import { cn } from '@/lib/utils';
import { RecurringTransaction } from '@/types';
import { CategoryIcon } from '@/components/features/categories/category-icon';

interface RecurringModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    recurring?: RecurringTransaction | null;
}

export const RecurringModal = memo(function RecurringModal({
    open,
    onOpenChange,
    recurring
}: RecurringModalProps) {
    const { createRecurring, updateRecurring } = useRecurring();
    const { categories } = useCategories();
    const { symbol } = useCurrency();
    const haptics = useHaptics();
    const [isLoading, setIsLoading] = useState(false);

    const isEditMode = !!recurring;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<RecurringFormData>({
        resolver: zodResolver(recurringSchema),
        defaultValues: {
            frequency: 'monthly',
            status: 'active',
            next_date: new Date(),
        },
    });

    useEffect(() => {
        if (open) {
            if (recurring) {
                reset({
                    name: recurring.name,
                    amount: recurring.amount,
                    category_id: recurring.category_id || '',
                    frequency: recurring.frequency,
                    status: recurring.status,
                    next_date: new Date(recurring.next_date),
                });
            } else {
                reset({
                    name: '',
                    amount: undefined as any,
                    category_id: '',
                    frequency: 'monthly',
                    status: 'active',
                    next_date: new Date(),
                });
            }
        }
    }, [open, recurring, reset]);

    const nextDate = watch('next_date');
    const frequency = watch('frequency');
    const selectedCategoryId = watch('category_id');

    const onSubmit = useCallback(async (data: RecurringFormData) => {
        setIsLoading(true);
        try {
            const payload = {
                ...data,
                next_date: data.next_date.toISOString()
            };
            if (isEditMode && recurring) {
                await updateRecurring(recurring.id, payload);
                haptics.success();
                toast.success('Recurring transaction updated');
            } else {
                await createRecurring(payload);
                haptics.success();
                toast.success('Recurring transaction created');
            }
            onOpenChange(false);
        } catch (error) {
            haptics.error();
            toast.error(isEditMode ? 'Failed to update' : 'Failed to create');
        } finally {
            setIsLoading(false);
        }
    }, [createRecurring, updateRecurring, haptics, onOpenChange, isEditMode, recurring]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[32px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isEditMode ? <Pencil weight="bold" /> : <Plus weight="bold" />}
                        {isEditMode ? 'Edit Recurring' : 'New Recurring Transaction'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Update subscription or recurring expense details' : 'Set up a subscription or regular bill'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Netflix, Rent, Gym"
                            className="bg-muted/30 border-none h-11 rounded-xl"
                            {...register('name')}
                        />
                        {errors.name && <p className="text-destructive text-[10px]">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="amount">Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{symbol}</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0"
                                    className="bg-muted/30 border-none h-11 pl-8 rounded-xl"
                                    {...register('amount', { valueAsNumber: true })}
                                />
                            </div>
                            {errors.amount && <p className="text-destructive text-[10px]">{errors.amount.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Frequency</Label>
                            <Select
                                value={frequency}
                                onValueChange={(val: any) => setValue('frequency', val)}
                            >
                                <SelectTrigger className="bg-muted/30 border-none h-11 rounded-xl">
                                    <SelectValue placeholder="Frequency" />
                                </SelectTrigger>
                                <SelectContent rounded-xl>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Category</Label>
                        <Select
                            value={selectedCategoryId}
                            onValueChange={(val) => setValue('category_id', val)}
                        >
                            <SelectTrigger className="bg-muted/30 border-none h-11 rounded-xl">
                                <SelectValue placeholder="Search category..." />
                            </SelectTrigger>
                            <SelectContent rounded-xl>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        <div className="flex items-center gap-2">
                                            <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                                            {cat.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category_id && <p className="text-destructive text-[10px]">{errors.category_id.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Next Payment Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-muted/30 border-none h-11 rounded-xl",
                                        !nextDate && "text-muted-foreground"
                                    )}
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {nextDate ? format(nextDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                                <CalendarComponent
                                    mode="single"
                                    selected={nextDate}
                                    onSelect={(date) => date && setValue('next_date', date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            className="flex-1 h-11 rounded-xl"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 h-11 rounded-xl shadow-lg bg-primary text-primary-foreground"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditMode ? 'Update' : 'Set Recurring'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
});
