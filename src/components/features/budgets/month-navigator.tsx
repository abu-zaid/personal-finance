'use client';

import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Group, Box } from '@/components/ui/layout';

interface MonthNavigatorProps {
    date: Date;
    isCurrentMonth: boolean;
    onPrev: () => void;
    onNext: () => void;
}

export function MonthNavigator({ date, isCurrentMonth, onPrev, onNext }: MonthNavigatorProps) {
    return (
        <Group align="center" justify="between" className="bg-white dark:bg-card p-2 rounded-2xl shadow-sm border">
            <Button variant="ghost" size="icon" onClick={onPrev} className="h-8 w-8 rounded-xl">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Box className="text-center">
                <h3 className="text-sm font-semibold">
                    {format(date, 'MMMM yyyy')}
                </h3>
                {isCurrentMonth && (
                    <span className="text-[10px] text-primary font-medium block -mt-0.5">Current</span>
                )}
            </Box>
            <Button variant="ghost" size="icon" onClick={onNext} className="h-8 w-8 rounded-xl">
                <ChevronRight className="h-4 w-4" />
            </Button>
        </Group>
    );
}
