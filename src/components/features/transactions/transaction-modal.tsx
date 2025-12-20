'use client';

import { useState, memo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Clock, Loader2, Pencil, Plus } from 'lucide-react';
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

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Transaction to edit - if provided, modal is in edit mode */
  transaction?: TransactionWithCategory | null;
}

export const TransactionModal = memo(function TransactionModal({
  open,
  onOpenChange,
  transaction
}: TransactionModalProps) {
  const { categories } = useCategories();
  const { createTransaction, updateTransaction } = useTransactions();
  const { symbol } = useCurrency();
  const haptics = useHaptics();
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!transaction;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      date: new Date(),
    },
  });

  // Reset form when transaction changes or modal opens
  useEffect(() => {
    if (open) {
      if (transaction) {
        // Edit mode - populate form with existing data
        reset({
          amount: transaction.amount,
          type: transaction.type || 'expense',
          categoryId: transaction.categoryId,
          date: new Date(transaction.date),
          notes: transaction.notes || '',
        });
      } else {
        // Add mode - reset to defaults
        reset({
          amount: undefined,
          type: 'expense',
          categoryId: '',
          date: new Date(),
          notes: '',
        });
      }
    }
  }, [open, transaction, reset]);

  const selectedDate = watch('date');
  const selectedCategoryId = watch('categoryId');
  const selectedType = watch('type');

  const onSubmit = useCallback(async (data: TransactionFormData) => {
    setIsLoading(true);
    try {
      // Ensure we're using a Date object and preserving time
      // If the user picked a date via calendar, it might have preserved time via onSelect
      // But we double check here to be safe, especially for 'today' defaults

      const payload = {
        ...data,
        date: data.date // The form state should already have the correct time from onSelect/default
      };

      if (isEditMode && transaction) {
        await updateTransaction(transaction.id, payload);
        haptics.success();
        toast.success('Transaction updated successfully');
      } else {
        await createTransaction(payload);
        haptics.success();
        toast.success('Transaction added successfully');
      }
      reset({ date: new Date() });
      onOpenChange(false);
    } catch (err) {
      console.error('Transaction submit error:', err);
      haptics.error();
      toast.error(isEditMode ? 'Failed to update transaction' : 'Failed to add transaction');
    } finally {
      setIsLoading(false);
    }
  }, [createTransaction, updateTransaction, haptics, onOpenChange, reset, isEditMode, transaction]);

  const handleClose = useCallback(() => {
    haptics.light();
    reset({ type: 'expense', date: new Date() });
    onOpenChange(false);
  }, [haptics, onOpenChange, reset]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Pencil className="h-4 w-4" />
                Edit Transaction
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Transaction
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the details of this transaction'
              : 'Record a new income or expense'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Transaction Type Toggle */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue('type', 'expense', { shouldDirty: true })}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 px-4 text-sm font-medium transition-all',
                  selectedType === 'expense'
                    ? 'border-destructive bg-destructive/10 text-destructive'
                    : 'border-border hover:border-muted-foreground/50'
                )}
              >
                <span className="text-lg">−</span>
                Expense
              </button>
              <button
                type="button"
                onClick={() => setValue('type', 'income', { shouldDirty: true })}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 px-4 text-sm font-medium transition-all',
                  selectedType === 'income'
                    ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'border-border hover:border-muted-foreground/50'
                )}
              >
                <span className="text-lg">+</span>
                Income
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2",
                selectedType === 'income' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
              )}>
                {selectedType === 'income' ? '+' : '−'}{symbol}
              </span>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-10 text-lg"
                {...register('amount', { valueAsNumber: true })}
              />
            </div>
            {errors.amount && (
              <p className="text-destructive text-sm">{errors.amount.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={selectedCategoryId}
              onValueChange={(value) => setValue('categoryId', value, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-destructive text-sm">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'flex-1 justify-start text-left font-normal',
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
                        // Preserve the current time when changing date
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
                    className="w-[100px] justify-start text-left font-normal px-2"
                  >
                    <Clock className="mr-1.5 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {selectedDate ? format(selectedDate, 'h:mm a') : 'Time'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="end" side="top">
                  <div className="flex gap-1.5">
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-muted-foreground">Hour</Label>
                      <Select
                        value={selectedDate ? String(selectedDate.getHours() % 12 || 12) : '12'}
                        onValueChange={(val) => {
                          const newDate = new Date(selectedDate || new Date());
                          const isPM = newDate.getHours() >= 12;
                          let hour = parseInt(val);
                          if (isPM && hour !== 12) hour += 12;
                          if (!isPM && hour === 12) hour = 0;
                          newDate.setHours(hour);
                          setValue('date', newDate, { shouldDirty: true });
                        }}
                      >
                        <SelectTrigger className="w-[56px] h-9 px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                            <SelectItem key={h} value={String(h)}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-muted-foreground">Min</Label>
                      <Select
                        value={selectedDate ? String(Math.floor(selectedDate.getMinutes() / 5) * 5).padStart(2, '0') : '00'}
                        onValueChange={(val) => {
                          const newDate = new Date(selectedDate || new Date());
                          newDate.setMinutes(parseInt(val));
                          setValue('date', newDate, { shouldDirty: true });
                        }}
                      >
                        <SelectTrigger className="w-[56px] h-9 px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                            <SelectItem key={m} value={String(m).padStart(2, '0')}>
                              {String(m).padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-muted-foreground">AM/PM</Label>
                      <Select
                        value={selectedDate && selectedDate.getHours() >= 12 ? 'PM' : 'AM'}
                        onValueChange={(val) => {
                          const newDate = new Date(selectedDate || new Date());
                          const currentHour = newDate.getHours();
                          if (val === 'PM' && currentHour < 12) {
                            newDate.setHours(currentHour + 12);
                          } else if (val === 'AM' && currentHour >= 12) {
                            newDate.setHours(currentHour - 12);
                          }
                          setValue('date', newDate, { shouldDirty: true });
                        }}
                      >
                        <SelectTrigger className="w-[56px] h-9 px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="e.g., Coffee at Starbucks"
              {...register('notes')}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || (isEditMode && !isDirty)}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

// Keep backward compatibility with AddTransactionModal
export const AddTransactionModal = memo(function AddTransactionModal({
  open,
  onOpenChange
}: Omit<TransactionModalProps, 'transaction'>) {
  return <TransactionModal open={open} onOpenChange={onOpenChange} transaction={null} />;
});
