'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface MonthYearPickerProps {
    date: Date;
    onChange: (date: Date) => void;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function MonthYearPicker({ date, onChange }: MonthYearPickerProps) {
    const [year, setYear] = useState(date.getFullYear());
    const [month, setMonth] = useState(date.getMonth());

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

    const handleYearChange = (newYear: string) => {
        const y = parseInt(newYear);
        setYear(y);
        const newDate = new Date(y, month, 1);
        onChange(newDate);
    };

    const handleMonthSelect = (index: number) => {
        setMonth(index);
        const newDate = new Date(year, index, 1);
        onChange(newDate);
    };

    return (
        <div className="p-4 bg-card rounded-2xl border shadow-sm space-y-4">
            {/* Year Selector */}
            <div className="flex justify-center">
                <Select
                    value={year.toString()}
                    onValueChange={handleYearChange}
                >
                    <SelectTrigger className="w-[120px] h-9 bg-muted/50 border-none rounded-full font-semibold focus:ring-primary/20">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((y) => (
                            <SelectItem key={y} value={y.toString()}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Months Grid */}
            <div className="grid grid-cols-3 gap-2">
                {MONTHS.map((m, i) => {
                    const isSelected = i === month;
                    return (
                        <button
                            key={m}
                            onClick={() => handleMonthSelect(i)}
                            className={cn(
                                "py-2 px-1 text-xs sm:text-sm rounded-xl transition-all duration-200 font-medium",
                                isSelected
                                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                                    : "bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {m.slice(0, 3)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
