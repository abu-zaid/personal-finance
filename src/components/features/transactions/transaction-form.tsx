'use client';

import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCategories } from '@/context/categories-context';
import { useTransactions } from '@/context/transactions-context';
import { useCurrency } from '@/hooks/use-currency';
import { useHaptics } from '@/hooks/use-haptics';
import { transactionSchema, TransactionFormData } from '@/lib/validations';
import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/features/categories/category-icon';
import { TransactionWithCategory } from '@/types';

interface TransactionFormProps {
    transaction?: TransactionWithCategory | null;
    onSuccess: () => void;
    onCancel: () => void;
    className?: string; // Allow passing existing classes for layout
}

export function TransactionForm({
    transaction,
    onSuccess,
    onCancel,
    className
}: TransactionFormProps) {
    const { categories } = useCategories();
    const { createTransaction, updateTransaction } = useTransactions();
    const { symbol } = useCurrency();
    const haptics = useHaptics();

    const isEditMode = !!transaction;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TransactionFormData>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: 'expense',
            date: new Date(),
        },
    });

    // Reset/Populate form
    useEffect(() => {
        if (transaction) {
            reset({
                amount: transaction.amount,
                type: transaction.type || 'expense',
                categoryId: transaction.categoryId,
                date: new Date(transaction.date),
                notes: transaction.notes || '',
            });
        } else {
            reset({
                amount: undefined,
                type: 'expense',
                categoryId: '',
                date: new Date(),
                notes: '',
            });
        }
    }, [transaction, reset]);

    const selectedDate = watch('date');
    const selectedCategoryId = watch('categoryId');
    const selectedType = watch('type');

    const onSubmit = useCallback(async (data: TransactionFormData) => {
        try {
            const payload = {
                ...data,
                date: data.date
            };

            if (isEditMode && transaction) {
                await updateTransaction(transaction.id, payload);
                haptics.success();
                toast.success('Transaction updated');
            } else {
                await createTransaction(payload);
                haptics.success();
                toast.success('Transaction added');
            }
            onSuccess();
        } catch (err) {
            console.error('Transaction submit error:', err);
            haptics.error();
            toast.error('Failed to save transaction');
        }
    }, [createTransaction, updateTransaction, haptics, onSuccess, isEditMode, transaction]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-6", className)}>
            {/* Type & Amount Group */}
            <div className="space-y-4">
                {/* Type Toggle */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                    <button
                        type="button"
                        onClick={() => {
                            setValue('type', 'expense', { shouldDirty: true });
                            haptics.light();
                        }}
                        className={cn(
                            'flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                            selectedType === 'expense'
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        Expense
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setValue('type', 'income', { shouldDirty: true });
                            haptics.light();
                        }}
                        className={cn(
                            'flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                            selectedType === 'income'
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        Income
                    </button>
                </div>

                {/* Big Amount Input */}
                <div className="relative flex justify-center py-4">
                    <div className="relative">
                        <span className={cn(
                            "absolute left-[-1.5rem] top-1/2 -translate-y-1/2 text-3xl font-medium",
                            selectedType === 'income' ? 'text-green-500' : 'text-muted-foreground'
                        )}>
                            {symbol}
                        </span>
                        <Input
                            id="amount"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            placeholder="0"
                            className="h-16 w-48 text-center text-5xl font-bold border-none bg-transparent focus-visible:ring-0 p-0 placeholder:text-muted-foreground/30"
                            {...register('amount', { valueAsNumber: true })}
                        />
                    </div>
                </div>
                {errors.amount && (
                    <p className="text-destructive text-sm text-center -mt-2">{errors.amount.message}</p>
                )}
            </div>

            {/* Category Grid */}
            <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
                <div className="grid grid-cols-4 gap-2">
                    {categories.map((category) => {
                        const isSelected = selectedCategoryId === category.id;
                        return (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() => {
                                    setValue('categoryId', category.id, { shouldDirty: true });
                                    haptics.light();
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-all border",
                                    isSelected
                                        ? "bg-primary/5 border-primary ring-1 ring-primary"
                                        : "bg-background border-border hover:border-foreground/20"
                                )}
                            >
                                <div
                                    className="p-2 rounded-full text-white transition-transform"
                                    style={{
                                        backgroundColor: isSelected ? category.color : 'rgba(128,128,128,0.2)',
                                        transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                                    }}
                                >
                                    <CategoryIcon icon={category.icon} color="currentColor" className="w-5 h-5 text-current" />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-medium truncate w-full text-center",
                                    isSelected ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {category.name}
                                </span>
                            </button>
                        )
                    })}
                </div>
                {errors.categoryId && (
                    <p className="text-destructive text-sm">{errors.categoryId.message}</p>
                )}
            </div>

            {/* Date & Time Row */}
            <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date & Time</Label>
                <div className="flex gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'flex-1 justify-start text-left font-normal h-11',
                                    !selectedDate && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, 'MMM d, yyyy') : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                    if (date) {
                                        const currentTime = selectedDate || new Date();
                                        date.setHours(currentTime.getHours(), currentTime.getMinutes());
                                        setValue('date', date, { shouldDirty: true });
                                    }
                                }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-[120px] justify-start text-left font-normal h-11 px-3"
                            >
                                <Clock className="mr-2 h-4 w-4 shrink-0" />
                                <span className="truncate">
                                    {selectedDate ? format(selectedDate, 'h:mm a') : 'Time'}
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="end" side="top">
                            <div className="flex gap-1.5">
                                <Input
                                    type="time"
                                    value={selectedDate ? format(selectedDate, 'HH:mm') : ''}
                                    onChange={(e) => {
                                        if (!e.target.value) return;
                                        const [hours, minutes] = e.target.value.split(':').map(Number);
                                        const newDate = new Date(selectedDate || new Date());
                                        newDate.setHours(hours, minutes);
                                        setValue('date', newDate, { shouldDirty: true });
                                    }}
                                    className="w-full"
                                />
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</Label>
                <Input
                    {...register('notes')}
                    placeholder="Add a note..."
                    className="h-11"
                />
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 pt-4 sticky bottom-0 bg-background pb-4 -mx-6 px-6 border-t mt-auto">
                <Button type="button" variant="outline" className="flex-1 h-12" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" className="flex-[2] h-12 text-base" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditMode ? 'Update Transaction' : 'Save Transaction')}
                </Button>
            </div>
        </form>
    );
}
