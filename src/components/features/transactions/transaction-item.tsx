'use client';

import { memo } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryIcon } from '@/components/features/categories';
import { TransactionWithCategory } from '@/types';

interface TransactionItemProps {
    transaction: TransactionWithCategory;
    isSelected: boolean;
    isBatchMode: boolean;
    formatCurrency: (amount: number) => string;
    onToggleSelection: (id: string) => void;
    onEdit: (transaction: TransactionWithCategory) => void;
}

export const TransactionItem = memo(function TransactionItem({
    transaction,
    isSelected,
    isBatchMode,
    formatCurrency,
    onToggleSelection,
    onEdit
}: TransactionItemProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-full"
        >
            <Card
                className={cn(
                    "group cursor-pointer transition-all duration-200 border-border/40 max-w-full",
                    "hover:border-primary/30 hover:shadow-md",
                    isSelected && "border-primary bg-primary/5"
                )}
                onClick={() => {
                    if (isBatchMode) onToggleSelection(transaction.id);
                    else onEdit(transaction);
                }}
            >
                <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-3">
                        {/* Checkbox */}
                        <AnimatePresence>
                            {isBatchMode && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 28, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden flex-shrink-0"
                                >
                                    <div
                                        className={cn(
                                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer mr-2",
                                            isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                        )}
                                        onClick={(e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            onToggleSelection(transaction.id);
                                        }}
                                    >
                                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={4} />}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Icon */}
                        <div
                            className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: `${transaction.category.color}20` }}
                        >
                            <CategoryIcon
                                icon={transaction.category.icon}
                                color={transaction.category.color}
                                size="sm"
                            />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                                <p className="font-semibold truncate text-sm md:text-base">
                                    {transaction.notes || transaction.category.name}
                                </p>
                                <p className={cn(
                                    "font-bold whitespace-nowrap text-sm md:text-base tabular-nums",
                                    transaction.type === 'income' ? "text-green-500" : ""
                                )}>
                                    {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-muted-foreground truncate">
                                    {transaction.category.name}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
});
