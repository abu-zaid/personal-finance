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
import { useCategories } from '@/context/categories-context';
import { useTransactions } from '@/context/transactions-context';
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
    const { categories } = useCategories();
    const { createTransaction, updateTransaction } = useTransactions();
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

    const setDate = (date: Date) => {
        setValue('date', date, { shouldDirty: true });
        haptics.light();
    };

    // Shared Form Elements helpers
    const TypeToggle = () => (
        <div className="bg-muted/50 p-1 rounded-full flex gap-1">
            <button
                type="button"
                onClick={() => { setValue('type', 'expense'); haptics.light(); }}
                className={cn(
                    "rounded-full text-sm font-medium transition-all",
                    isDesktop ? "px-6 py-2" : "px-8 py-2.5",
                    selectedType === 'expense' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
            >
                Expense
            </button>
            <button
                type="button"
                onClick={() => { setValue('type', 'income'); haptics.light(); }}
                className={cn(
                    "rounded-full text-sm font-medium transition-all",
                    isDesktop ? "px-6 py-2" : "px-8 py-2.5",
                    selectedType === 'income' ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
            >
                Income
            </button>
        </div>
    );

    const AmountSection = () => (
        <div className="relative flex items-center justify-center gap-2">
            <span className={cn(
                "font-medium text-muted-foreground",
                isDesktop ? "text-3xl" : "text-4xl"
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
                    isDesktop ? "h-20 text-7xl" : "h-24 text-8xl",
                    "!bg-transparent !border-none !shadow-none !ring-0 !outline-none",
                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                    selectedType === 'income' ? "text-emerald-500" : "text-foreground"
                )}
                {...register('amount', { valueAsNumber: true })}
            />
        </div>
    );

    if (isDesktop) {
        return (
            <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-8", className)}>
                {/* Header: Type & Amount */}
                <div className="flex flex-col items-center gap-6">
                    <TypeToggle />
                    <AmountSection />
                    {errors.amount && (
                        <p className="text-red-500 text-sm font-medium animate-pulse">{errors.amount.message}</p>
                    )}
                </div>

                {/* 2. Details Section */}
                <div className="flex-1 bg-card rounded-t-[2rem] px-6 pt-6 pb-32 flex flex-col gap-6 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] border-t border-border/50">

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
                            className={cn("w-full h-14 text-lg font-bold rounded-[2rem] shadow-lg transition-all", selectedType === 'income' ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25" : "bg-foreground hover:bg-foreground/90 text-background shadow-zinc-500/25")}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (isEditMode ? 'Update Transaction' : 'Save Transaction')}
                        </Button>
                    </div>
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
            <div className="flex-1 bg-card rounded-t-[2rem] px-6 pt-6 pb-32 flex flex-col gap-6 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] border-t border-border/50">

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
                        className={cn("w-full h-14 text-lg font-bold rounded-[2rem] shadow-lg transition-all", selectedType === 'income' ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25" : "bg-foreground hover:bg-foreground/90 text-background shadow-zinc-500/25")}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (isEditMode ? 'Update Transaction' : 'Save Transaction')}
                    </Button>
                </div>
            </div>
        </form>
    );
}
