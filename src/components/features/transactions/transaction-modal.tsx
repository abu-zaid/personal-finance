'use client';

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
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/use-media-query';
import { TransactionForm } from './transaction-form';
import { TransactionWithCategory } from '@/types';

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Transaction to edit - if provided, modal is in edit mode */
  transaction?: TransactionWithCategory | null;
}

export function TransactionModal({
  open,
  onOpenChange,
  transaction
}: TransactionModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isEditMode = !!transaction;

  const handleClose = () => {
    onOpenChange(false);
  };

  const title = isEditMode ? 'Edit Transaction' : 'Add Transaction';
  const description = isEditMode ? 'Update the details of this transaction' : 'Record a new income or expense';

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <TransactionForm
            transaction={transaction}
            onSuccess={handleClose}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-hidden rounded-t-[20px] p-0 flex flex-col">
        <div className="px-5 pt-5 pb-2 shrink-0">
          <SheetHeader className="text-left">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          <TransactionForm
            transaction={transaction}
            onSuccess={handleClose}
            onCancel={handleClose}
            className="pb-safe-area"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
