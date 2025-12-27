'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Group, Box } from '@/components/ui/layout';
import { BudgetForm } from './budget-form';
import { BudgetWithSpending } from '@/types';

interface CreateBudgetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentBudget: BudgetWithSpending | null;
    selectedDate: Date;
    categories: any[];
    symbol: string;
    formatCurrency: (val: number) => string;
    onSave: (totalBudget: number, allocations: Record<string, number>) => Promise<void>;
}

export function CreateBudgetDialog({
    open,
    onOpenChange,
    currentBudget,
    selectedDate,
    categories,
    symbol,
    formatCurrency,
    onSave
}: CreateBudgetDialogProps) {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [isSaving, setIsSaving] = useState(false);
    const [totalBudget, setTotalBudget] = useState<number>(0);
    const [allocations, setAllocations] = useState<Record<string, number>>({});

    // Reset or Load data when opened
    useEffect(() => {
        if (open) {
            if (currentBudget) {
                setTotalBudget(currentBudget.totalAmount);
                const existingAllocations: Record<string, number> = {};
                currentBudget.allocations.forEach((a) => {
                    existingAllocations[a.categoryId] = a.amount;
                });
                setAllocations(existingAllocations);
            } else {
                setTotalBudget(0);
                setAllocations({});
            }
        }
    }, [open, currentBudget]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(totalBudget, allocations);
            // Dialog close is handled by parent or hook upon success, 
            // but usually we want to stop loading state here if it stays open on error
        } catch (error) {
            // Error handled in hook (toast)
        } finally {
            setIsSaving(false);
        }
    };

    const FormContent = (
        <BudgetForm
            totalBudget={totalBudget}
            setTotalBudget={setTotalBudget}
            allocations={allocations}
            setAllocations={setAllocations}
            categories={categories}
            symbol={symbol}
            formatCurrency={formatCurrency}
        />
    );

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="max-w-md max-h-[90vh] flex flex-col"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>{currentBudget ? 'Edit' : 'Create'} Budget</DialogTitle>
                        <DialogDescription>Plan your spending for {format(selectedDate, 'MMMM')}</DialogDescription>
                    </DialogHeader>
                    <Box className="flex-1 overflow-y-auto px-1">
                        {FormContent}
                    </Box>
                    <DialogFooter className="gap-2 sm:gap-0 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Budget
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="flex flex-col rounded-t-[2rem] p-0 h-[92vh] max-h-[92vh]"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <Box className="flex-1 overflow-y-auto p-6 pb-0">
                    <SheetHeader className="text-left mb-6 px-1">
                        <SheetTitle className="text-xl">{currentBudget ? 'Edit' : 'Create'} Budget</SheetTitle>
                        <SheetDescription>Plan your spending for {format(selectedDate, 'MMMM')}</SheetDescription>
                    </SheetHeader>

                    {FormContent}

                    {/* Spacer for sticky footer coverage */}
                    <Box className="h-12" />
                </Box>

                {/* Sticky Footer */}
                <Box className="p-6 pt-2 bg-background border-t">
                    <Group align="center" gap={3}>
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-2xl h-14 text-base font-medium">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="flex-1 rounded-2xl h-14 text-base font-bold">
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </Group>
                </Box>
            </SheetContent>
        </Sheet>
    );
}
