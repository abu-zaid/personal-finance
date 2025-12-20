'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowsClockwise,
    Plus,
    Trash,
    Pencil,
    Bell,
    Calendar,
    Wallet,
    CheckCircle,
    Warning
} from 'phosphor-react';
import {
    PageTransition,
    FadeIn,
    StaggerContainer,
    StaggerItem
} from '@/components/animations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/hooks/use-currency';
import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/features/categories';
import { useCategories } from '@/context/categories-context';

export default function RecurringPage() {
    const { categories } = useCategories();
    const { formatCurrency } = useCurrency();

    // Sample recurring data
    const [recurringTransactions, setRecurringTransactions] = useState([
        {
            id: '1',
            name: 'Netflix Subscription',
            amount: 15.99,
            categoryId: categories.find(c => c.name.toLowerCase().includes('entertainment'))?.id || '1',
            frequency: 'monthly',
            nextDate: '2025-01-15',
            status: 'active',
        },
        {
            id: '2',
            name: 'Apartment Rent',
            amount: 1200,
            categoryId: categories.find(c => c.name.toLowerCase().includes('housing'))?.id || '2',
            frequency: 'monthly',
            nextDate: '2025-01-01',
            status: 'active',
        },
        {
            id: '3',
            name: 'Gym Membership',
            amount: 45,
            categoryId: categories.find(c => c.name.toLowerCase().includes('health'))?.id || '3',
            frequency: 'monthly',
            nextDate: '2025-01-12',
            status: 'active',
        },
        {
            id: '4',
            name: 'Cloud Storage',
            amount: 9.99,
            categoryId: categories.find(c => c.name.toLowerCase().includes('services'))?.id || '4',
            frequency: 'monthly',
            nextDate: '2025-01-20',
            status: 'paused',
        }
    ]);

    const totalMonthlyRecurring = useMemo(() => {
        return recurringTransactions
            .filter(t => t.status === 'active')
            .reduce((sum, t) => sum + t.amount, 0);
    }, [recurringTransactions]);

    const getCategory = (id: string) => categories.find(c => c.id === id);

    return (
        <PageTransition>
            <div className="space-y-6 pb-24">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Recurring</h1>
                        <p className="text-muted-foreground text-sm">Manage your subscriptions and fixed costs.</p>
                    </div>
                    <Button className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-5 w-5" weight="bold" />
                        Add New
                    </Button>
                </div>

                {/* Summary Card */}
                <FadeIn>
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Monthly Commitment</p>
                                    <p className="text-3xl font-bold mt-1">{formatCurrency(totalMonthlyRecurring)}</p>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                                    <ArrowsClockwise size={28} weight="bold" className="text-[#101010]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </FadeIn>

                {/* List Section */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Bell size={20} className="text-primary" />
                        Upcoming Payments
                    </h2>

                    <StaggerContainer className="grid gap-4">
                        {recurringTransactions.map((item) => {
                            const category = getCategory(item.categoryId);
                            const isPaused = item.status === 'paused';

                            return (
                                <StaggerItem key={item.id}>
                                    <Card className={cn(
                                        "overflow-hidden transition-all hover:shadow-md",
                                        isPaused && "opacity-60"
                                    )}>
                                        <CardContent className="p-0">
                                            <div className="flex items-center justify-between p-4">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: `${category?.color || '#ccc'}22` }}
                                                    >
                                                        <CategoryIcon
                                                            icon={category?.icon || 'Package'}
                                                            color={category?.color || '#ccc'}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-base">{item.name}</h3>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                            <span className="flex items-center gap-1 uppercase tracking-widest font-bold">
                                                                {item.frequency}
                                                            </span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={14} />
                                                                Next: {item.nextDate}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center gap-4">
                                                    <div>
                                                        <p className="text-lg font-bold">{formatCurrency(item.amount)}</p>
                                                        {isPaused ? (
                                                            <Badge variant="outline" className="text-[10px] uppercase">Paused</Badge>
                                                        ) : (
                                                            <Badge className="bg-primary/20 text-primary border-none text-[10px] uppercase font-bold">Active</Badge>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-1 group">
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                            <Pencil size={18} />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                            <Trash size={18} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </StaggerItem>
                            );
                        })}
                    </StaggerContainer>
                </div>

                {/* Insight Section */}
                <FadeIn>
                    <Card className="border-dashed border-2 bg-muted/30">
                        <CardContent className="p-8 text-center flex flex-col items-center">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <CheckCircle size={32} className="text-primary" />
                            </div>
                            <h3 className="text-lg font-bold">Auto-Generation is Active</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-2">
                                Recurring transactions will be automatically added to your ledger on their due dates. You&apos;ll get a notification to confirm them.
                            </p>
                        </CardContent>
                    </Card>
                </FadeIn>
            </div>
        </PageTransition>
    );
}
