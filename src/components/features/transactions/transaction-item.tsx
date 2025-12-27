'use client';

import { memo, useState } from 'react';
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import { Check, Trash2, Edit } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryIcon } from '@/components/features/categories';
import { TransactionWithCategory } from '@/types';
import { Box, Group } from '@/components/ui/layout';
import { useHaptics } from '@/hooks/use-haptics';

interface TransactionItemProps {
    transaction: TransactionWithCategory;
    isSelected: boolean;
    isBatchMode: boolean;
    formatCurrency: (amount: number) => string;
    onToggleSelection: (id: string) => void;
    onEdit: (transaction: TransactionWithCategory) => void;
    onDelete?: (id: string) => void;
}

export const TransactionItem = memo(function TransactionItem({
    transaction,
    isSelected,
    isBatchMode,
    formatCurrency,
    onToggleSelection,
    onEdit,
    onDelete
}: TransactionItemProps) {
    const controls = useAnimation();
    const haptics = useHaptics();
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnd = async (event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
        setIsDragging(false);
        const threshold = -80;
        if (info.offset.x < threshold) {
            // Swiped Left (Delete)
            haptics.medium();
            if (onDelete) {
                onDelete(transaction.id);
            } else {
                // Snap back if no delete handler
                controls.start({ x: 0 });
            }
        } else if (info.offset.x > 80) {
            // Swiped Right (Edit) - Optional, maybe just snap back or trigger edit
            haptics.medium();
            onEdit(transaction);
            controls.start({ x: 0 });
        } else {
            // Snap back
            controls.start({ x: 0 });
        }
    };

    return (
        <Box className="relative overflow-hidden selection:bg-none">
            {/* Background Actions Layer */}
            <Box className="absolute inset-0 flex items-center justify-between pointer-events-none">
                {/* Left Action (Edit) - Green */}
                <Box className={cn(
                    "h-full w-1/2 bg-blue-500/10 flex items-center justify-start pl-6",
                    "transition-opacity duration-200",
                    isDragging ? "opacity-100" : "opacity-0"
                )}>
                    {/* Edit Icon hidden slightly */}
                    <Edit className="w-5 h-5 text-blue-500" />
                </Box>

                {/* Right Action (Delete) - Red */}
                <Box className={cn(
                    "h-full w-1/2 bg-destructive/10 flex items-center justify-end pr-6",
                    "transition-opacity duration-200",
                    isDragging ? "opacity-100" : "opacity-0"
                )}>
                    <Trash2 className="w-5 h-5 text-destructive" />
                </Box>
            </Box>

            <motion.div
                layout
                drag={isBatchMode ? false : "x"}
                dragConstraints={{ left: -100, right: 100 }}
                dragElastic={0.1}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                animate={controls}
                whileTap={{ cursor: "grabbing" }}
                style={{ touchAction: "pan-y" }}
                className="relative z-10 bg-background"
            >
                <Card
                    className={cn(
                        "group cursor-pointer transition-all duration-200 border-border/40 max-w-full rounded-2xl",
                        "hover:border-primary/30 hover:shadow-sm",
                        isSelected && "border-primary bg-primary/5",
                        isDragging && "shadow-none"
                    )}
                    onClick={() => {
                        if (!isDragging) {
                            if (isBatchMode) onToggleSelection(transaction.id);
                            else onEdit(transaction);
                        }
                    }}
                >
                    <CardContent className="p-3 md:p-4">
                        <Group align="center" gap={3}>
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
                                        <Box
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
                                        </Box>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Icon */}
                            <Box
                                className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                                style={{ backgroundColor: `${transaction.category.color}20` }}
                            >
                                <CategoryIcon
                                    icon={transaction.category.icon}
                                    color={transaction.category.color}
                                    size="sm"
                                />
                            </Box>

                            {/* Content */}
                            <Box className="flex-1 min-w-0">
                                <Group justify="between" align="start" gap={2}>
                                    <p className="font-semibold truncate text-sm md:text-base">
                                        {transaction.notes || transaction.category.name}
                                    </p>
                                    <p className={cn(
                                        "font-bold whitespace-nowrap text-sm md:text-base tabular-nums",
                                        transaction.type === 'income' ? "text-green-500" : ""
                                    )}>
                                        {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                                    </p>
                                </Group>
                                <Group align="center" gap={2} className="mt-0.5">
                                    <p className="text-xs text-muted-foreground truncate">
                                        {transaction.category.name}
                                    </p>
                                </Group>
                            </Box>
                        </Group>
                    </CardContent>
                </Card>
            </motion.div>
        </Box>
    );
});
