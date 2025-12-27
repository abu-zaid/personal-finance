'use client';

import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Stack, Group } from '@/components/ui/layout';

interface BudgetsHeaderProps {
    isEditing: boolean;
    onAction: () => void;
}

export function BudgetsHeader({ isEditing, onAction }: BudgetsHeaderProps) {
    return (
        <Group align="center" justify="between" className="pt-2">
            <Stack gap={1}>
                <h1 className="text-2xl font-bold">Budgets</h1>
                <p className="text-muted-foreground text-sm">
                    Manage your spending limits
                </p>
            </Stack>
            <Button
                onClick={onAction}
                className="rounded-full px-5 shadow-sm hover:shadow-md transition-all bg-primary text-primary-foreground hover:bg-primary/90"
            >
                {isEditing ? (
                    <>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                    </>
                ) : (
                    <>
                        <Plus className="mr-2 h-4 w-4" /> Create
                    </>
                )}
            </Button>
        </Group>
    );
}
