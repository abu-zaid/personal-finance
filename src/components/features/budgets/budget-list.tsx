'use client';

import { StaggerContainer, StaggerItem } from '@/components/animations';
import { BudgetCategoryItem } from './budget-category-item';
import { EmptyState } from '@/components/shared';
import { Sparkles } from 'lucide-react';
import { Stack, Box } from '@/components/ui/layout';

interface BudgetListProps {
    allocations: any[]; // define stricter type
    formatCurrency: (val: number) => string;
    onAddAllocation: () => void;
}

export function BudgetList({ allocations, formatCurrency, onAddAllocation }: BudgetListProps) {
    if (allocations.length === 0) {
        return (
            <EmptyState
                icon={<Sparkles className="h-10 w-10 text-muted-foreground" />}
                title="No category limits"
                description="Set specific limits for categories to track them better."
                action={{ label: "Add Allocations", onClick: onAddAllocation }}
            />
        );
    }

    return (
        <Stack gap={3}>
            <Box className="text-sm font-semibold text-muted-foreground pl-1">Category Breakdown</Box>
            <StaggerContainer className="space-y-3">
                {allocations.map((item) => (
                    <StaggerItem key={item.categoryId}>
                        <BudgetCategoryItem item={item} formatCurrency={formatCurrency} />
                    </StaggerItem>
                ))}
            </StaggerContainer>
        </Stack>
    );
}
