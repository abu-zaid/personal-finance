'use client';


import { useCallback, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAddTransactionMutation, useUpdateTransactionMutation, useGetCategoriesQuery } from '@/lib/features/api/apiSlice';
import { useCurrency } from '@/hooks/use-currency';
import { useHaptics } from '@/hooks/use-haptics';
import { transactionSchema, TransactionFormData } from '@/lib/validations'; // Assuming this exists and fits
import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/features/categories/category-icon';
import { TransactionWithCategory } from '@/types';
import { Box, Stack, Group, Grid } from '@/components/ui/layout';

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
    onCancel: _onCancel,
    variant = 'mobile',
    className
}: TransactionFormProps) {
    // Queries & Mutations
    const { data: categories = [] } = useGetCategoriesQuery();
    const [addTransaction, { isLoading: isAdding }] = useAddTransactionMutation();
    const [updateTransaction, { isLoading: isUpdating }] = useUpdateTransactionMutation();

    const { symbol } = useCurrency();
    const haptics = useHaptics();

    const isEditMode = !!transaction;
    const isDesktop = variant === 'desktop';
    const isSubmitting = isAdding || isUpdating;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
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

    const { user } = useAuth(); // Import useAuth
    // ...
    const onSubmit = useCallback(async (data: TransactionFormData) => {
        if (!user) {
            toast.error("You must be logged in");
            return;
        }
        try {
            // Map form data to DB schema
            const payload = {
                amount: data.amount,
                type: data.type,
                date: data.date.toISOString(),
                notes: data.notes,
                category_id: data.categoryId,
                user_id: user.id // Add user_id
            };
            // ...

            if (isEditMode && transaction) {
                await updateTransaction({ id: transaction.id, ...payload }).unwrap();
                haptics.success();
                toast.success('Transaction updated');
            } else {
                await addTransaction(payload).unwrap();
                haptics.success();
                toast.success('Transaction added');
            }
            onSuccess();
        } catch {
            haptics.error();
            toast.error('Failed to save transaction');
        }
    }, [addTransaction, updateTransaction, haptics, onSuccess, isEditMode, transaction, user]);

    const setDate = (date: Date) => {
        setValue('date', date, { shouldDirty: true });
        haptics.light();
    };

    // Shared Form Elements helpers
    const TypeToggle = () => (
        <Box className="bg-muted/50 p-1 rounded-full flex gap-1 relative">
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
                    <Box
                        asChild
                        className="absolute inset-0 bg-destructive rounded-full shadow-sm"
                    >
                        <motion.div
                            layoutId="type-toggle-bg"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                    </Box>
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
                    <Box
                        asChild
                        className="absolute inset-0 bg-primary rounded-full shadow-sm"
                    >
                        <motion.div
                            layoutId="type-toggle-bg"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                    </Box>
                )}
                <span className="relative z-10">Income</span>
            </button>
        </Box>
    );

    const QuickAmounts = () => {
        const quickAmounts = [50, 100, 200, 500, 1000, 2000];
        const currentAmount = watch('amount');

        return (
            <Group justify="center" gap={2} className="flex-wrap">
                {quickAmounts.map((amount) => (
                    <button
                        key={amount}
                        type="button"
                        onClick={() => {
                            setValue('amount', amount, { shouldDirty: true });
                            haptics.light();
                        }}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            currentAmount === amount
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        {symbol}{amount}
                    </button>
                ))}
            </Group>
        );
    };

    const AmountSection = () => (
        <Stack gap={3} align="center">
            <Group align="center" justify="center" gap={2} className="relative">
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
                    autoFocus={!isEditMode}
                    className={cn(
                        "w-full max-w-[280px] text-center font-bold bg-transparent border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 placeholder:text-muted-foreground/20 caret-primary tabular-nums",
                        isDesktop ? "h-16 text-4xl" : "h-20 text-5xl",
                        "!bg-transparent !border-none !shadow-none !ring-0 !outline-none",
                        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                        selectedType === 'income' ? "text-primary" : "text-destructive"
                    )}
                    {...register('amount', { valueAsNumber: true })}
                />
            </Group>
            {!isDesktop && <QuickAmounts />}
            {errors.amount && (
                <p className="text-red-500 text-xs">{errors.amount.message}</p>
            )}
        </Stack>
    );

    if (isDesktop) {
        return (
            <Stack asChild gap={4} className={className}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Type Toggle & Amount - Horizontal Layout */}
                    <Group align="center" gap={6}>
                        <TypeToggle />
                        <Box className="flex-1">
                            <Group align="center" gap={2}>
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
                            </Group>
                            {errors.amount && (
                                <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
                            )}
                        </Box>
                    </Group>

                    {/* Category Selection */}
                    <Stack gap={2}>
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Category</Label>
                        <Grid cols={5} gap={2} className="max-h-[200px] overflow-y-auto overflow-x-hidden pr-2">
                            {categories.map((category) => {
                                const isSelected = selectedCategoryId === category.id;
                                return (
                                    <Stack
                                        asChild
                                        key={category.id}
                                        gap={1}
                                        align="center"
                                        className="group cursor-pointer"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => { setValue('categoryId', category.id); haptics.selection(); }}
                                        >
                                            <Box
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
                                            </Box>
                                            <span className={cn(
                                                "text-[10px] font-medium truncate max-w-full text-center leading-tight",
                                                isSelected ? "text-foreground font-semibold" : "text-muted-foreground"
                                            )}>
                                                {category.name}
                                            </span>
                                        </button>
                                    </Stack>
                                );
                            })}
                        </Grid>
                        {errors.categoryId && (
                            <p className="text-red-500 text-xs">{errors.categoryId.message}</p>
                        )}
                    </Stack>

                    {/* Date & Notes */}
                    <Grid cols={2} gap={4}>
                        {/* Date Selection */}
                        <Stack gap={2}>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase">Date</Label>
                            <Stack gap={1}>
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
                            </Stack>
                        </Stack>

                        {/* Notes */}
                        <Stack gap={2}>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase">Notes</Label>
                            <Input
                                {...register('notes')}
                                placeholder="Optional note..."
                                className="h-[88px] resize-none bg-muted/30 border-border text-sm"
                            />
                        </Stack>
                    </Grid>

                    {/* Submit Button */}
                    <Box className="pt-2">
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
                    </Box>
                </form>
            </Stack>
        );
    }

    // MOBILE LAYOUT
    return (
        <Stack asChild className={cn("h-full relative", className)}>
            <form onSubmit={handleSubmit(onSubmit)}>
                {/* 1. Value Section (Top) */}
                <Stack
                    align="center"
                    justify="center"
                    gap={6}
                    className="flex-0 py-8 shrink-0 transition-colors"
                >
                    <TypeToggle />
                    <AmountSection />
                    {errors.amount && (
                        <p className="text-red-500 text-sm font-medium animate-pulse">{errors.amount.message}</p>
                    )}
                </Stack>

                {/* 2. Details Section */}
                <Stack
                    gap={6}
                    className="flex-1 bg-card rounded-t-[2rem] px-6 pt-6 pb-6 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] border-t border-border/50"
                >
                    {/* Category Carousel Mobile */}
                    <Stack gap={3}>
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Select Category</Label>
                        <Group gap={4} className="overflow-x-auto pb-4 px-4 py-2 snap-x scrollbar-hide">
                            {categories.map((category) => {
                                const isSelected = selectedCategoryId === category.id;
                                return (
                                    <Stack
                                        asChild
                                        key={category.id}
                                        align="center"
                                        gap={2}
                                        className="group snap-start min-w-[72px]"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => { setValue('categoryId', category.id); haptics.selection(); }}
                                        >
                                            <Box
                                                asChild
                                                className={cn(
                                                    "w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors",
                                                    isSelected ? "bg-background" : "bg-muted hover:bg-muted/80 border-transparent"
                                                )}
                                                style={isSelected ? { backgroundColor: `${category.color}20` } : undefined}
                                            >
                                                <motion.div
                                                    animate={{ scale: isSelected ? 1.1 : 1, borderColor: isSelected ? category.color : 'transparent' }}
                                                >
                                                    <CategoryIcon icon={category.icon} color={isSelected ? category.color : "currentColor"} className={cn("w-7 h-7", isSelected ? "" : "text-muted-foreground")} />
                                                </motion.div>
                                            </Box>
                                            <span className={cn("text-xs font-medium truncate max-w-[72px] transition-colors", isSelected ? "text-foreground font-semibold" : "text-muted-foreground")}>{category.name}</span>
                                        </button>
                                    </Stack>
                                );
                            })}
                            {categories.length === 0 && (<Box className="text-sm text-muted-foreground italic py-4">No categories found.</Box>)}
                        </Group>
                    </Stack>

                    {/* Date Chips & Notes Mobile */}
                    <Stack gap={6}>
                        <Stack gap={3}>
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Date & Time</Label>
                            <Group wrap="wrap" gap={2}>
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
                            </Group>
                        </Stack>

                        <Stack gap={3}>
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Notes</Label>
                            <Input {...register('notes')} placeholder="Add a note... (optional)" className="bg-muted/30 border-transparent focus:bg-background h-12 rounded-xl" />
                        </Stack>
                    </Stack>
                </Stack>

                {/* Sticky Footer Action Mobile */}
                <Box className="fixed bottom-0 inset-x-0 p-4 pointer-events-none">
                    <Box className="pointer-events-auto max-w-md mx-auto">
                        <Button
                            type="submit"
                            size="lg"
                            className={cn("w-full h-14 text-lg font-bold rounded-[2rem] shadow-lg transition-all text-white", selectedType === 'income' ? "bg-primary hover:bg-primary/90 shadow-primary/25" : "bg-destructive hover:bg-destructive/90 shadow-destructive/25")}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (isEditMode ? 'Update Transaction' : 'Save Transaction')}
                        </Button>
                    </Box>
                </Box>
            </form>
        </Stack>
    );
}
