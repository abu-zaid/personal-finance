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
          categoryId: transaction.categoryId,
          date: new Date(transaction.date),
          notes: transaction.notes || '',
        });
      } else {
        // Add mode - reset to defaults
        reset({
          amount: undefined,
          categoryId: '',
          date: new Date(),
          notes: '',
        });
      }
    }
  }, [open, transaction, reset]);

  const selectedDate = watch('date');
  const selectedCategoryId = watch('categoryId');

  const onSubmit = useCallback(async (data: TransactionFormData) => {
    setIsLoading(true);
    try {
      if (isEditMode && transaction) {
        await updateTransaction(transaction.id, data);
        haptics.success();
        toast.success('Transaction updated successfully');
      } else {
        await createTransaction(data);
        haptics.success();
        toast.success('Transaction added successfully');
      }
      reset({ date: new Date() });
      onOpenChange(false);
    } catch {
      haptics.error();
      toast.error(isEditMode ? 'Failed to update transaction' : 'Failed to add transaction');
    } finally {
      setIsLoading(false);
    }
  }, [createTransaction, updateTransaction, haptics, onOpenChange, reset, isEditMode, transaction]);

  const handleClose = useCallback(() => {
    haptics.light();
    reset({ date: new Date() });
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
                Edit Expense
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Expense
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the details of this expense' 
              : 'Record a new expense transaction'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2">
                {symbol}
              </span>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-7 text-lg"
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
              <div className="relative w-[120px]">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  className="pl-9"
                  value={selectedDate ? format(selectedDate, 'HH:mm') : ''}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const newDate = new Date(selectedDate || new Date());
                    newDate.setHours(hours, minutes);
                    setValue('date', newDate, { shouldDirty: true });
                  }}
                />
              </div>
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
              {isEditMode ? 'Save Changes' : 'Add Expense'}
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
