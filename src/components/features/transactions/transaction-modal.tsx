'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/use-media-query';
import { TransactionForm } from './transaction-form';
import { TransactionWithCategory } from '@/types';
import { Box, Stack } from '@/components/ui/layout';

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

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[480px] p-0 bg-card border-border shadow-2xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">
            {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
          </DialogTitle>
          <TransactionForm
            transaction={transaction}
            onSuccess={handleClose}
            onCancel={handleClose}
            variant="desktop"
            className="h-auto px-6 py-8"
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] max-h-[90vh] rounded-t-[2rem] p-0 gap-0 border-t-0 bg-background text-foreground shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] flex flex-col after:hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetTitle className="sr-only">
          {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
        </SheetTitle>
        <Stack align="center" justify="center" className="pt-3 pb-2 shrink-0">
          <Box className="w-12 h-1.5 bg-border rounded-full" />
        </Stack>

        <Box className="flex-1 overflow-y-auto overflow-x-hidden">
          <TransactionForm
            transaction={transaction}
            onSuccess={handleClose}
            onCancel={handleClose}
            className="h-full"
          />
        </Box>
      </SheetContent>
    </Sheet>
  );
}
