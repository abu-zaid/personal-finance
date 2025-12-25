'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Memoized individual option
const ThemeOption = memo(function ThemeOption({
    label,
    icon: Icon,
    isSelected,
    onClick
}: {
    label: string;
    icon: any;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200",
                isSelected
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-muted/50 hover:bg-muted"
            )}
        >
            <div className={cn(
                "p-2.5 sm:p-3 rounded-xl transition-colors",
                isSelected ? "bg-primary/20 text-primary" : "bg-background text-muted-foreground"
            )}>
                <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5")} />
            </div>
            <span className={cn(
                "text-xs sm:text-sm font-medium",
                isSelected ? "text-primary" : "text-muted-foreground"
            )}>
                {label}
            </span>
            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 shadow-sm"
                >
                    <Check className="h-3 w-3 text-primary-foreground" />
                </motion.div>
            )}
        </button>
    );
});

interface ThemeSelectorProps {
    currentTheme: string | undefined;
    onThemeChange: (theme: string) => void;
}

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Appearance</h3>
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-card">
                <CardContent className="p-4 grid grid-cols-3 gap-3">
                    <ThemeOption
                        label="Light"
                        icon={Sun}
                        isSelected={currentTheme === 'light'}
                        onClick={() => onThemeChange('light')}
                    />
                    <ThemeOption
                        label="Dark"
                        icon={Moon}
                        isSelected={currentTheme === 'dark'}
                        onClick={() => onThemeChange('dark')}
                    />
                    <ThemeOption
                        label="Auto"
                        icon={Monitor}
                        isSelected={currentTheme === 'system'}
                        onClick={() => onThemeChange('system')}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
