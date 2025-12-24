'use client';

import { useMemo, useState } from 'react';
import {
    RotateCw,
    Plus,
    Trash2,
    Edit2,
    Calendar,
    CheckCircle2,
    Bell
} from 'lucide-react';
import {
    PageTransition,
    FadeIn,
    StaggerContainer,
    StaggerItem
} from '@/components/animations';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/hooks/use-currency';
import { cn } from '@/lib/utils';
import { RecurringSkeleton } from '@/components/skeletons/skeleton-loaders';
import { Skeleton } from '@/components/ui/skeleton';
import { RecurringModal } from '@/components/features/recurring/recurring-modal';
import { CategoryIcon } from '@/components/features/categories';
import { useCategories } from '@/context/categories-context';
import { useRecurring } from '@/context/recurring-context';

export default function RecurringPage() {
    const { formatCurrency } = useCurrency();
    const { categories } = useCategories();
    const { recurringTransactions, isLoading, deleteRecurring } = useRecurring();

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRecurring, setEditingRecurring] = useState<any>(null);

    const handleAdd = () => {
        setEditingRecurring(null);
        setModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingRecurring(item);
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this recurring transaction?')) {
            try {
                await deleteRecurring(id);
                toast.success('Deleted');
            } catch (err) {
                toast.error('Failed to delete');
            }
        }
    };

    const monthlyCommitment = useMemo(() => {
        return recurringTransactions
            .filter(t => t.status === 'active')
            .reduce((sum, t) => {
                const amount = Number(t.amount);
                if (t.frequency === 'monthly') return sum + amount;
                if (t.frequency === 'weekly') return sum + (amount * 4);
                if (t.frequency === 'yearly') return sum + (amount / 12);
                return sum + amount;
            }, 0);
    }, [recurringTransactions]);

    // Loading State
    if (isLoading) {
        return (
            <div className="flex flex-col h-full w-full overflow-hidden bg-background">
                {/* Header Skeleton */}
                <div className="px-4 md:px-6 py-4 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-9 w-24 rounded-full" />
                    </div>

                    {/* Summary Card Skeleton */}
                    <div className="p-4 rounded-2xl border border-border/40 bg-card/50 space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-6 w-24" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-baseline">
                                <Skeleton className="h-8 w-32" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-2 w-full rounded-full" />
                        </div>
                    </div>
                </div>

                {/* List Skeleton */}
                <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-20 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <RecurringSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    const getCategory = (id: string) => categories.find(c => c.id === id);

    return (
        <PageTransition className="flex flex-col h-full w-full overflow-hidden bg-background">
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                {/* Header */}
                <div className="px-4 md:px-6 py-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">Recurring</h1>
                            <p className="text-muted-foreground text-sm truncate">Manage your subscriptions.</p>
                        </div>
                        <Button
                            onClick={handleAdd}
                            size="sm"
                            className="h-9 w-9 p-0 rounded-full shadow-lg bg-gradient-to-br from-[#98EF5A] to-[#7BEA3C] hover:shadow-xl hover:scale-105 transition-all text-[#101010]"
                        >
                            <Plus className="h-5 w-5" strokeWidth={3} />
                        </Button>
                    </div>

                    {/* Summary Card */}
                    <FadeIn>
                        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                            <CardContent className="p-5 md:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">Monthly Commitment</p>
                                        <p className="text-2xl md:text-3xl font-bold mt-1 text-foreground">{formatCurrency(monthlyCommitment)}</p>
                                    </div>
                                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-foreground/5 flex items-center justify-center">
                                        <RotateCw size={24} className="text-foreground md:w-7 md:h-7" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="text-[10px] md:text-xs font-bold px-2 py-1 rounded-lg bg-foreground/5 text-foreground">
                                        {recurringTransactions.filter(t => t.status === 'active').length} Active Subscriptions
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </FadeIn>

                    {/* Recurring List */}
                    <div className="space-y-4 pb-6">
                        <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
                            <Bell size={18} className="text-primary md:w-5 md:h-5" />
                            Upcoming Payments
                        </h2>

                        <StaggerContainer className="grid gap-3 md:gap-4">
                            {recurringTransactions.map((item) => {
                                const category = getCategory(item.category_id || '');
                                const isPaused = item.status === 'paused';

                                return (
                                    <StaggerItem key={item.id}>
                                        <Card className={cn(
                                            "overflow-hidden transition-all duration-200 border-border/40 hover:border-primary/30 hover:shadow-md",
                                            isPaused && "opacity-60"
                                        )}>
                                            <CardContent className="p-0">
                                                <div className="grid grid-cols-[auto_1fr_auto] gap-3 p-3 md:p-4 items-center">
                                                    {/* Icon */}
                                                    <div
                                                        className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: `${category?.color || '#ccc'}22` }}
                                                    >
                                                        <CategoryIcon
                                                            icon={category?.icon || 'Package'}
                                                            color={category?.color || '#ccc'}
                                                            size="sm"
                                                        />
                                                    </div>

                                                    {/* Main Content */}
                                                    <div className="min-w-0 flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-sm md:text-base truncate">
                                                                {item.name}
                                                            </h3>
                                                            {isPaused && (
                                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase hidden sm:flex">Paused</Badge>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1 uppercase tracking-wider font-medium text-[10px] md:text-xs">
                                                                {item.frequency}
                                                            </span>
                                                            <span className="text-border">•</span>
                                                            <span className="flex items-center gap-1 truncate">
                                                                <Calendar size={12} className="md:w-3.5 md:h-3.5" />
                                                                Next: {item.next_date}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Right Side: Amount & Actions */}
                                                    <div className="flex items-center gap-3 md:gap-4 pl-2">
                                                        <div className="text-right">
                                                            <p className="text-base md:text-lg font-bold whitespace-nowrap">{formatCurrency(item.amount)}</p>
                                                            <div className="flex justify-end sm:hidden mt-0.5">
                                                                {isPaused ? (
                                                                    <span className="text-[10px] uppercase text-muted-foreground font-medium">Paused</span>
                                                                ) : (
                                                                    <span className="text-[10px] uppercase text-primary font-bold">Active</span>
                                                                )}
                                                            </div>
                                                            <div className="hidden sm:block">
                                                                {!isPaused && (
                                                                    <Badge className="bg-primary/20 text-primary border-none text-[10px] uppercase font-bold hover:bg-primary/30">Active</Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-1 group">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 md:h-9 md:w-9 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                                                onClick={() => handleEdit(item)}
                                                            >
                                                                <Edit2 size={16} className="md:w-[18px] md:h-[18px]" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 md:h-9 md:w-9 text-destructive rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                                                onClick={() => handleDelete(item.id)}
                                                            >
                                                                <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
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

                        {/* Insight Section */}
                        <FadeIn>
                            <Card className="border-dashed border-2 bg-muted/30 mt-6">
                                <CardContent className="p-8 text-center flex flex-col items-center">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                        <CheckCircle2 size={32} className="text-primary" />
                                    </div>
                                    <h3 className="text-lg font-bold">Auto-Generation is Active</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm mt-2">
                                        Recurring transactions will be automatically added to your ledger on their due dates. You&apos;ll get a notification to confirm them.
                                    </p>
                                </CardContent>
                            </Card>
                        </FadeIn>
                    </div>
                </div>
            </div>

            <RecurringModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                recurring={editingRecurring}
            />
        </PageTransition>
    );
}
