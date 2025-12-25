'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppDispatch } from '@/lib/hooks';
import { createTransaction, updateTransaction } from '@/lib/features/transactions/transactionsSlice';
import { selectCategories } from '@/lib/features/categories/categoriesSlice';
import { useAppSelector } from '@/lib/hooks';
import { useCurrency } from '@/hooks/use-currency';
import { useHaptics } from '@/hooks/use-haptics';
import { transactionSchema, TransactionFormData } from '@/lib/validations';
import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/features/categories/category-icon';
import { TransactionWithCategory } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionFormProps {
    transaction?: TransactionWithCategory | null;
    onSuccess: () => void;
    onCancel: () => void;
    variant?: 'mobile' | 'desktop';
    className?: string;
}

export function TransactionForm({
    transaction,
    onSuccess,
    onCancel,
    variant = 'mobile',
    className
}: TransactionFormProps) {
    const categories = useAppSelector(selectCategories);
    const dispatch = useAppDispatch();
    const { symbol } = useCurrency();
    const haptics = useHaptics();

    const isEditMode = !!transaction;
    const isDesktop = variant === 'desktop';

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

    const selectedType = watch('type');
    const selectedDate = watch('date');
    const selectedCategoryId = watch('categoryId');

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

    const onSubmit = useCallback(async (data: TransactionFormData) => {
        try {
            const payload = {
                ...data,
                date: data.date
            };

            if (isEditMode && transaction) {
                await dispatch(updateTransaction({ id: transaction.id, input: payload })).unwrap();
                haptics.success();
                toast.success('Transaction updated');
            } else {
                await dispatch(createTransaction(payload)).unwrap();
                haptics.success();
                toast.success('Transaction added');
            }
            onSuccess();
        } catch (err) {
            console.error('Transaction submit error:', err);
            haptics.error();
            toast.error('Failed to save transaction');
        }
    }, [dispatch, haptics, onSuccess, isEditMode, transaction]);

    const setDate = (date: Date) => {
        setValue('date', date, { shouldDirty: true });
        haptics.light();
    };

    // Shared Form Elements helpers
    const TypeToggle = () => (
        <div className="bg-muted/50 p-1 rounded-full flex gap-1 relative">
            <button
                type="button"
                onClick={() => { setValue('type', 'expense'); haptics.light(); }}
                className={cn(
                    "relative rounded-full text-sm font-medium transition-colors z-10",
                    isDesktop ? "px-6 py-2" : "px-8 py-2.5",
                    selectedType === 'expense' ? "text-white" : "text-muted-foreground hover:text-foreground"
                )}
            >
                {selectedType === 'expense' && (
                    <motion.div
                        layoutId="type-toggle-bg"
                        className="absolute inset-0 bg-destructive rounded-full shadow-sm"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
                <span className="relative z-10">Expense</span>
            </button>
            <button
                type="button"
                onClick={() => { setValue('type', 'income'); haptics.light(); }}
                className={cn(
                    "relative rounded-full text-sm font-medium transition-colors z-10",
                    isDesktop ? "px-6 py-2" : "px-8 py-2.5",
                    selectedType === 'income' ? "text-white" : "text-muted-foreground hover:text-foreground"
                )}
            >
                {selectedType === 'income' && (
                    <motion.div
                        layoutId="type-toggle-bg"
                        className="absolute inset-0 bg-primary rounded-full shadow-sm"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
                <span className="relative z-10">Income</span>
            </button>
        </div>
    );

    const AmountSection = () => (
        <div className="relative flex items-center justify-center gap-2">
            <span className={cn(
                "font-medium text-muted-foreground",
                isDesktop ? "text-2xl" : "text-3xl"
            )}>
                {symbol}
            </span>
            <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0"
                className={cn(
                    "w-full max-w-[280px] text-center font-bold bg-transparent border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 placeholder:text-muted-foreground/20 caret-primary tabular-nums",
                    isDesktop ? "h-16 text-4xl" : "h-20 text-5xl",
                    "!bg-transparent !border-none !shadow-none !ring-0 !outline-none",
                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                    selectedType === 'income' ? "text-primary" : "text-destructive"
                )}
                {...register('amount', { valueAsNumber: true })}
            />
        </div>
    );

    if (isDesktop) {
        return (
            <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
                {/* Type Toggle & Amount - Horizontal Layout */}
                <div className="flex items-center gap-6">
                    <TypeToggle />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-medium text-muted-foreground">{symbol}</span>
                            <Input
                                id="amount"
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="0.00"
                                className={cn(
                                    "flex-1 text-2xl font-bold bg-transparent border-b-2 border-t-0 border-x-0 rounded-none px-2 py-1 focus-visible:ring-0 focus-visible:border-primary",
                                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                    selectedType === 'income' ? "text-primary" : "text-destructive"
                                )}
                                {...register('amount', { valueAsNumber: true })}
                            />
                        </div>
                        {errors.amount && (
                            <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
                        )}
                    </div>
                </div>

                {/* Category Selection - Compact Grid */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Category</Label>
                    <div className="grid grid-cols-5 gap-2 max-h-[200px] overflow-y-auto overflow-x-hidden pr-2">
                        {categories.map((category) => {
                            const isSelected = selectedCategoryId === category.id;
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => { setValue('categoryId', category.id); haptics.selection(); }}
                                    className="flex flex-col items-center gap-1.5 group"
                                >
                                    <div
                                        className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all",
                                            isSelected ? "shadow-sm" : "bg-muted hover:bg-muted/80 border-transparent"
                                        )}
                                        style={isSelected ? {
                                            backgroundColor: `${category.color}15`,
                                            borderColor: category.color
                                        } : undefined}
                                    >
                                        <CategoryIcon
                                            icon={category.icon}
                                            color={isSelected ? category.color : "currentColor"}
                                            className={cn("w-5 h-5", isSelected ? "" : "text-muted-foreground")}
                                        />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-medium truncate max-w-full text-center leading-tight",
                                        isSelected ? "text-foreground font-semibold" : "text-muted-foreground"
                                    )}>
                                        {category.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {errors.categoryId && (
                        <p className="text-red-500 text-xs">{errors.categoryId.message}</p>
                    )}
                </div>

                {/* Date & Notes - 2 Column Layout */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Date Selection */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Date</Label>
                        <div className="flex flex-col gap-1.5">
                            <button
                                type="button"
                                onClick={() => setDate(new Date())}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                                    isSameDay(selectedDate, new Date())
                                        ? "bg-foreground text-background border-foreground"
                                        : "bg-background border-border text-muted-foreground hover:border-foreground/50"
                                )}
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={() => setDate(subDays(new Date(), 1))}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                                    isSameDay(selectedDate, subDays(new Date(), 1))
                                        ? "bg-foreground text-background border-foreground"
                                        : "bg-background border-border text-muted-foreground hover:border-foreground/50"
                                )}
                            >
                                Yesterday
                            </button>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            "px-3 py-1.5 rounded-md text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors",
                                            !isSameDay(selectedDate, new Date()) && !isSameDay(selectedDate, subDays(new Date(), 1))
                                                ? "bg-foreground text-background border-foreground"
                                                : "bg-background border-border text-muted-foreground hover:border-foreground/50"
                                        )}
                                    >
                                        <CalendarIcon className="w-3 h-3" />
                                        <span>{format(selectedDate, 'MMM d')}</span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                const newDate = new Date(date);
                                                const currentTime = selectedDate || new Date();
                                                newDate.setHours(currentTime.getHours());
                                                newDate.setMinutes(currentTime.getMinutes());
                                                newDate.setSeconds(currentTime.getSeconds());
                                                setDate(newDate);
                                            }
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Notes</Label>
                        <Input
                            {...register('notes')}
                            placeholder="Optional note..."
                            className="h-[88px] resize-none bg-muted/30 border-border text-sm"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                    <Button
                        type="submit"
                        size="lg"
                        className={cn(
                            "w-full h-11 text-sm font-semibold rounded-lg transition-all text-white",
                            selectedType === 'income'
                                ? "bg-primary hover:bg-primary/90"
                                : "bg-destructive hover:bg-destructive/90"
                        )}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            isEditMode ? 'Update Transaction' : 'Save Transaction'
                        )}
                    </Button>
                </div>
            </form>
        );
    }

    // MOBILE LAYOUT
    return (
        <form onSubmit={handleSubmit(onSubmit)} className={cn("flex flex-col h-full relative", className)}>
            {/* 1. Value Section (Top) */}
            <div className="flex-0 flex flex-col items-center justify-center py-8 space-y-6 shrink-0 transition-colors">
                <TypeToggle />
                <AmountSection />
                {errors.amount && (
                    <p className="text-red-500 text-sm font-medium animate-pulse">{errors.amount.message}</p>
                )}
            </div>

            {/* 2. Details Section */}
            <div className="flex-1 bg-card rounded-t-[2rem] px-6 pt-6 pb-6 flex flex-col gap-6 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] border-t border-border/50">

                {/* Category Carousel Mobile */}
                <div className="space-y-3">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Select Category</Label>
                    <div className="flex gap-4 overflow-x-auto pb-4 px-4 py-2 snap-x scrollbar-hide">
                        {categories.map((category) => {
                            const isSelected = selectedCategoryId === category.id;
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => { setValue('categoryId', category.id); haptics.selection(); }}
                                    className="flex flex-col items-center gap-2 group snap-start min-w-[72px]"
                                >
                                    <motion.div
                                        animate={{ scale: isSelected ? 1.1 : 1, borderColor: isSelected ? category.color : 'transparent' }}
                                        className={cn(
                                            "w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors",
                                            isSelected ? "bg-background" : "bg-muted hover:bg-muted/80 border-transparent"
                                        )}
                                        style={isSelected ? { backgroundColor: `${category.color}20` } : undefined}
                                    >
                                        <CategoryIcon icon={category.icon} color={isSelected ? category.color : "currentColor"} className={cn("w-7 h-7", isSelected ? "" : "text-muted-foreground")} />
                                    </motion.div>
                                    <span className={cn("text-xs font-medium truncate max-w-[72px] transition-colors", isSelected ? "text-foreground font-semibold" : "text-muted-foreground")}>{category.name}</span>
                                </button>
                            );
                        })}
                        {categories.length === 0 && (<div className="text-sm text-muted-foreground italic py-4">No categories found.</div>)}
                    </div>
                </div>

                {/* Date Chips & Notes Mobile */}
                <div className="space-y-6">
                    <div className="flex flex-col gap-3">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Date & Time</Label>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setDate(new Date())} className={cn("px-4 py-2 rounded-full text-sm font-medium border transition-colors", isSameDay(selectedDate, new Date()) ? "bg-foreground text-background border-foreground" : "bg-background border-border text-muted-foreground hover:border-foreground/50")}>Today</button>
                            <button type="button" onClick={() => setDate(subDays(new Date(), 1))} className={cn("px-4 py-2 rounded-full text-sm font-medium border transition-colors", isSameDay(selectedDate, subDays(new Date(), 1)) ? "bg-foreground text-background border-foreground" : "bg-background border-border text-muted-foreground hover:border-foreground/50")}>Yesterday</button>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button type="button" className={cn("px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 transition-colors", !isSameDay(selectedDate, new Date()) && !isSameDay(selectedDate, subDays(new Date(), 1)) ? "bg-foreground text-background border-foreground" : "bg-background border-border text-muted-foreground hover:border-foreground/50")}>
                                        <CalendarIcon className="w-4 h-4" /> <span>{format(selectedDate, 'MMM d')}</span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setDate(date)} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Notes</Label>
                        <Input {...register('notes')} placeholder="Add a note... (optional)" className="bg-muted/30 border-transparent focus:bg-background h-12 rounded-xl" />
                    </div>
                </div>
            </div>

            {/* Sticky Footer Action Mobile */}
            <div className="fixed bottom-0 inset-x-0 p-4 pointer-events-none">
                <div className="pointer-events-auto max-w-md mx-auto">
                    <Button
                        type="submit"
                        size="lg"
                        className={cn("w-full h-14 text-lg font-bold rounded-[2rem] shadow-lg transition-all text-white", selectedType === 'income' ? "bg-primary hover:bg-primary/90 shadow-primary/25" : "bg-destructive hover:bg-destructive/90 shadow-destructive/25")}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (isEditMode ? 'Update Transaction' : 'Save Transaction')}
                    </Button>
                </div>
            </div>
        </form>
    );
}
