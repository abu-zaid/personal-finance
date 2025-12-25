'use client';

import {
    Search,
    SlidersHorizontal,
    X,
    Calendar as CalendarIcon
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { BRAND_GRADIENT } from '@/lib/constants';
import { TransactionSort } from '@/types';

interface TransactionsToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    filters: any; // Type strictly if possible
    onFilterChange: (filters: any) => void;
    onClearFilters: () => void;
    sortConfig: TransactionSort;
    onSortChange: (sort: TransactionSort) => void;
    isBatchMode: boolean;
    onToggleBatchMode: () => void;
    categories: any[];
    activeFilterCount: number;
}

export function TransactionsToolbar({
    search,
    onSearchChange,
    filters,
    onFilterChange,
    onClearFilters,
    sortConfig,
    onSortChange,
    isBatchMode,
    onToggleBatchMode,
    categories,
    activeFilterCount
}: TransactionsToolbarProps) {
    return (
        <div className="space-y-4">
            {/* Main Toolbar */}
            <div className="px-4 md:px-6 flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search transactions..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 h-10 px-3">
                            <SlidersHorizontal className="h-4 w-4" />
                            <span className="hidden sm:inline">Filters</span>
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] ml-1">
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0 sm:pr-0">
                        <SheetHeader className="px-6 py-4 border-b flex-none">
                            <SheetTitle>Filters & Sort</SheetTitle>
                            <SheetDescription>Refine your transaction list</SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            <div className="space-y-6">
                                {/* Type Filter */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium">Type</label>
                                    <Tabs
                                        value={filters.type || 'all'}
                                        onValueChange={(v) => onFilterChange({ type: v as 'all' | 'income' | 'expense' })}
                                    >
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="all">All</TabsTrigger>
                                            <TabsTrigger value="expense">Expense</TabsTrigger>
                                            <TabsTrigger value="income">Income</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>

                                {/* Sort */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium">Sort By</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant={sortConfig.field === 'date' ? 'default' : 'outline'}
                                            size="sm"
                                            className="h-9"
                                            onClick={() => onSortChange({
                                                field: 'date',
                                                order: sortConfig.field === 'date' && sortConfig.order === 'desc' ? 'asc' : 'desc'
                                            })}
                                        >
                                            Date {sortConfig.field === 'date' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                                        </Button>
                                        <Button
                                            variant={sortConfig.field === 'amount' ? 'default' : 'outline'}
                                            size="sm"
                                            className="h-9"
                                            onClick={() => onSortChange({
                                                field: 'amount',
                                                order: sortConfig.field === 'amount' && sortConfig.order === 'desc' ? 'asc' : 'desc'
                                            })}
                                        >
                                            Amount {sortConfig.field === 'amount' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                                        </Button>
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium">Date Range</label>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant={!filters.startDate ? 'secondary' : 'outline'}
                                            size="sm"
                                            onClick={() => onFilterChange({ startDate: undefined, endDate: undefined })}
                                        >
                                            All Time
                                        </Button>
                                        <Button
                                            variant={
                                                filters.startDate &&
                                                    new Date(filters.startDate).getDate() === 1 &&
                                                    new Date(filters.startDate).getMonth() === new Date().getMonth() &&
                                                    new Date(filters.startDate).getFullYear() === new Date().getFullYear()
                                                    ? 'secondary' : 'outline'
                                            }
                                            size="sm"
                                            onClick={() => onFilterChange({
                                                startDate: startOfMonth(new Date()).toISOString(),
                                                endDate: endOfMonth(new Date()).toISOString()
                                            })}
                                        >
                                            This Month
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onFilterChange({
                                                startDate: subDays(new Date(), 30).toISOString(),
                                                endDate: new Date().toISOString()
                                            })}
                                        >
                                            Last 30 Days
                                        </Button>
                                    </div>
                                    {filters.startDate && (
                                        <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-2 rounded-md">
                                            <CalendarIcon className="h-4 w-4" />
                                            <span>
                                                {format(new Date(filters.startDate), 'MMM d')} - {filters.endDate ? format(new Date(filters.endDate), 'MMM d, yyyy') : 'Now'}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 ml-auto hover:bg-primary/20"
                                                onClick={() => onFilterChange({ startDate: undefined, endDate: undefined })}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Categories */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium">Categories</label>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map(cat => {
                                            const isSelected = (filters.categoryIds || []).includes(cat.id);
                                            return (
                                                <Badge
                                                    key={cat.id}
                                                    variant={isSelected ? 'default' : 'outline'}
                                                    className={cn(
                                                        "cursor-pointer px-3 py-1.5 hover:bg-secondary/80 transition-colors",
                                                        isSelected && "border-transparent"
                                                    )}
                                                    style={isSelected ? { backgroundColor: cat.color, color: '#000' } : {}}
                                                    onClick={() => {
                                                        const current = filters.categoryIds || [];
                                                        if (isSelected) {
                                                            onFilterChange({ categoryIds: current.filter((id: string) => id !== cat.id) });
                                                        } else {
                                                            onFilterChange({ categoryIds: [...current, cat.id] });
                                                        }
                                                    }}
                                                >
                                                    {cat.name}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <SheetFooter className="px-6 py-4 border-t flex-none mt-0 gap-3 sm:gap-4">
                            <Button variant="outline" onClick={onClearFilters} className="flex-1 h-11 sm:h-10">
                                Reset
                            </Button>
                            <SheetClose asChild>
                                <Button className="flex-1 h-11 sm:h-10 border-0 hover:opacity-90 transition-opacity bg-primary text-primary-foreground hover:bg-primary/90">
                                    Apply Filters
                                </Button>
                            </SheetClose>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>

                <Button
                    variant={isBatchMode ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-10"
                    onClick={onToggleBatchMode}
                >
                    {isBatchMode ? 'Done' : 'Select'}
                </Button>
            </div>

            {/* Quick Category Filters - Sticky */}
            <div className="sticky top-0 z-20 overflow-x-hidden">
                {/* visual layer */}
                <div className="bg-background/95 backdrop-blur-sm border-b border-border/40">
                    {/* scroll layer */}
                    <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
                        {/* content layer */}
                        <div className="flex w-fit items-center gap-2 py-3 px-4 md:px-6 whitespace-nowrap">
                            <Button
                                variant={(filters.categoryIds || []).length === 0 ? "default" : "outline"}
                                size="sm"
                                onClick={() => onFilterChange({ categoryIds: [] })}
                                className="flex-shrink-0"
                            >
                                All
                            </Button>

                            {categories.map(cat => {
                                const isSelected = (filters.categoryIds || []).includes(cat.id);

                                return (
                                    <Button
                                        key={cat.id}
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        className="flex-shrink-0 gap-1.5 whitespace-nowrap"
                                        onClick={() => {
                                            const current = filters.categoryIds || [];
                                            onFilterChange({
                                                categoryIds: isSelected
                                                    ? current.filter((id: string) => id !== cat.id)
                                                    : [...current, cat.id],
                                            });
                                        }}
                                        style={
                                            isSelected
                                                ? { backgroundColor: cat.color, borderColor: cat.color, color: "#000" }
                                                : {}
                                        }
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: isSelected ? "#000" : cat.color }}
                                        />
                                        {cat.name}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>



        </div>
    );
}
