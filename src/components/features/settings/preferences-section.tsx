'use client';

import { DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Currency } from '@/types';
import { CURRENCY_OPTIONS } from '@/lib/constants';

interface PreferencesSectionProps {
    currency: Currency;
    onCurrencyChange: (currency: string) => void;
    // hapticsEnabled: boolean; // Removed
    // onHapticsChange: (enabled: boolean) => void; // Removed
}

export function PreferencesSection({
    currency,
    onCurrencyChange,
    // hapticsEnabled,
    // onHapticsChange
}: PreferencesSectionProps) {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Preferences</h3>
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-card overflow-hidden divide-y divide-border/50">
                {/* Currency */}
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-full">
                            <DollarSign className="w-4 h-4 text-foreground" />
                        </div>
                        <span className="font-medium text-sm">Currency</span>
                    </div>
                    <Select
                        value={currency}
                        onValueChange={onCurrencyChange}
                    >
                        <SelectTrigger className="w-[180px] h-8 text-xs border-none bg-muted/50 rounded-full truncate focus:ring-primary/20">
                            <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {CURRENCY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </Card>
        </div>
    );
}
