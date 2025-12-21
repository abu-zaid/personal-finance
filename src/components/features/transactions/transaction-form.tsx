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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
            {/* Type & Amount Group */}
            <div className="space-y-3">
                {/* Type Toggle */}
                <Tabs value={selectedType} onValueChange={(v) => {
                    setValue('type', v as 'income' | 'expense', { shouldDirty: true });
                    haptics.light();
                }} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="expense">Expense</TabsTrigger>
                        <TabsTrigger value="income">Income</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Big Amount Input */}
                <div className="relative flex justify-center py-2">
                    <div className="relative flex items-center justify-center">
                        <span className={cn(
                            "text-3xl font-medium mr-2 self-center text-muted-foreground",
                            selectedType === 'income' && "text-green-500"
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
                            className="h-16 w-48 text-center text-5xl font-bold border-none bg-transparent shadow-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground/30 tabular-nums"
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
                            <Button
                                key={category.id}
                                type="button"
                                variant={isSelected ? "outline" : "ghost"}
                                onClick={() => {
                                    setValue('categoryId', category.id, { shouldDirty: true });
                                    haptics.light();
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1.5 h-auto py-2 px-1 rounded-xl transition-all hover:bg-muted",
                                    isSelected
                                        ? "bg-primary/5 border-primary ring-1 ring-primary hover:bg-primary/10"
                                        : "border-transparent hover:border-border"
                                )}
                            >
                                <div
                                    className="p-2 rounded-full text-white transition-transform shadow-sm"
                                    style={{
                                        backgroundColor: isSelected ? category.color : 'rgba(128,128,128,0.2)',
                                        transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                                    }}
                                >
                                    <CategoryIcon icon={category.icon} color="currentColor" className="w-4 h-4 text-white" />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-medium truncate w-full",
                                    isSelected ? "text-foreground font-semibold" : "text-muted-foreground"
                                )}>
                                    {category.name}
                                </span>
                            </Button>
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
