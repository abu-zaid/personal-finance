'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { format, isToday, isYesterday, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar as CalendarIcon,
  MoreVertical,
  Trash2,
  Plus,
  Check,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Download
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { TransactionWithCategory, TransactionFilters, TransactionSort } from '@/types';
import { useTransactions } from '@/context/transactions-context';
import { useCategories } from '@/context/categories-context';
import { useCurrency } from '@/hooks/use-currency';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import { PageTransition } from '@/components/animations';
import { CategoryIcon } from '@/components/features/categories';
import { TransactionModal } from '@/components/features/transactions';
import { EmptyState } from '@/components/shared';

export default function TransactionsPage() {
  // Context
  const {
    transactions,
    isLoading,
    deleteTransaction,
    loadMore,
    hasMore,
    totalCount
  } = useTransactions();
  const { categories } = useCategories();
  const { formatCurrency } = useCurrency();

  // Local State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list'); // Future proofing
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);

  // Filters State
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortConfig, setSortConfig] = useState<TransactionSort>({ field: 'date', order: 'desc' });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  // Infinite Scroll Ref
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---

  const handleScroll = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !isLoading) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleScroll, { rootMargin: '100px' });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [handleScroll]);

  const getDateLabel = (dateFn: Date) => {
    if (isToday(dateFn)) return 'Today';
    if (isYesterday(dateFn)) return 'Yesterday';
    return format(dateFn, 'EEEE, MMM d');
  };

  // --- Filtering & Sorting Logic ---

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // 1. Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        t.category.name.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      );
    }

    // 2. Date Range
    if (dateRange.from) {
      result = result.filter(t => new Date(t.date) >= dateRange.from!);
    }
    if (dateRange.to) {
      // Set to end of day
      const endOfDay = new Date(dateRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter(t => new Date(t.date) <= endOfDay);
    }

    // 3. Category
    if (selectedCategoryIds.length > 0) {
      result = result.filter(t => selectedCategoryIds.includes(t.categoryId));
    }

    // 4. Type
    if (selectedType !== 'all') {
      result = result.filter(t => t.type === selectedType);
    }

    // 5. Amount (optional, implemented if desired)
    // result = result.filter(t => t.amount >= priceRange[0] && t.amount <= priceRange[1]);

    // 6. Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.field) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.name.localeCompare(b.category.name);
          break;
      }
      return sortConfig.order === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transactions, searchQuery, dateRange, selectedCategoryIds, selectedType, sortConfig]);

  // Group by Date for List View
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, TransactionWithCategory[]> = {};
    filteredTransactions.forEach(t => {
      const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  // Statistics based on CURRENT VIEW
  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  // --- Handlers ---

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBatchDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} transactions?`)) return;

    // Process purely client-side optimistic UI first? 
    // The context `deleteTransaction` handles one by one. 
    // We can loop.
    const ids = Array.from(selectedIds);
    setSelectedIds(new Set()); // Clear selection immediately
    setIsBatchMode(false);

    try {
      await Promise.all(ids.map(id => deleteTransaction(id)));
      toast.success(`Deleted ${ids.length} transactions`);
    } catch (err) {
      toast.error("Some transactions failed to delete");
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateRange({ from: undefined, to: undefined });
    setSelectedCategoryIds([]);
    setSelectedType('all');
    setSortConfig({ field: 'date', order: 'desc' });
  };

  const activeFilterCount = [
    dateRange.from,
    selectedCategoryIds.length > 0,
    selectedType !== 'all'
  ].filter(Boolean).length;

  return (
    <PageTransition className="w-full pb-24 space-y-4">

      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between sticky top-0 bg-background/95 backdrop-blur-md z-20 -mx-4 px-4 py-4 md:static md:bg-transparent md:p-0 border-b md:border-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground text-sm">
            {totalCount} entries • {formatCurrency(stats.expense)} expenses
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile: Filter Sheet Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-2 relative">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 ml-1 text-[10px] min-w-[1.25rem]">{activeFilterCount}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] sm:h-auto sm:side-right rounded-t-[20px] sm:rounded-none">
              <SheetHeader className="text-left mb-6">
                <SheetTitle>Filter & Sort</SheetTitle>
                <SheetDescription>Refine your transaction list</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 pb-20">
                {/* Search in Filter for Mobile */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notes, categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={sortConfig.field === 'date' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortConfig({ field: 'date', order: sortConfig.order === 'asc' ? 'desc' : 'asc' })}
                    >
                      Date {sortConfig.field === 'date' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                    </Button>
                    <Button
                      variant={sortConfig.field === 'amount' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortConfig({ field: 'amount', order: sortConfig.order === 'desc' ? 'asc' : 'desc' })}
                    >
                      Amount {sortConfig.field === 'amount' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                    </Button>
                  </div>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <div className="flex p-1 bg-muted rounded-lg">
                    {['all', 'expense', 'income'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type as any)}
                        className={cn(
                          "flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition-all",
                          selectedType === type ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categories</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {categories.map(cat => {
                      const isSelected = selectedCategoryIds.includes(cat.id);
                      return (
                        <Badge
                          key={cat.id}
                          variant={isSelected ? 'default' : 'outline'}
                          className="cursor-pointer"
                          style={isSelected ? { backgroundColor: cat.color, color: '#000' } : {}}
                          onClick={() => {
                            if (isSelected) setSelectedCategoryIds(prev => prev.filter(id => id !== cat.id));
                            else setSelectedCategoryIds(prev => [...prev, cat.id]);
                          }}
                        >
                          {cat.name}
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                {/* Date Range - Simplistic for now */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timeframe</label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDateRange({ from: undefined, to: undefined })}>All Time</Button>
                    <Button variant="outline" size="sm" onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}>This Month</Button>
                    <Button variant="outline" size="sm" onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}>Last 30 Days</Button>
                  </div>
                </div>

              </div>
              <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
                <Button variant="outline" onClick={clearFilters} className="w-1/3">Reset</Button>
                <SheetClose asChild>
                  <Button className="w-2/3">Show {filteredTransactions.length} Results</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Button
            variant={isBatchMode ? 'secondary' : 'outline'}
            size="sm"
            className="h-10"
            onClick={() => {
              setIsBatchMode(!isBatchMode);
              setSelectedIds(new Set());
            }}
          >
            {isBatchMode ? 'Done' : 'Select'}
          </Button>

          <Button
            size="sm"
            className="h-10 w-10 p-0 rounded-full shadow-lg bg-gradient-to-br from-[#98EF5A] to-[#7BEA3C] hover:shadow-xl hover:scale-105 transition-all text-[#101010]"
            onClick={() => {
              setEditingTransaction(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-5 w-5" strokeWidth={3} />
          </Button>
        </div>
      </div>

      {/* --- DESKTOP TOOLBAR (Hidden on mobile) --- */}
      <div className="hidden md:flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/40"
          />
        </div>
        {/* Helper Tags */}
        <div className="flex gap-2">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
              Clear Filters ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="space-y-6 min-h-[50vh]">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No transactions found</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
              Try adjusting your filters or search query to find what you're looking for.
            </p>
            <Button variant="link" onClick={clearFilters} className="mt-4">
              Clear all filters
            </Button>
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([date, list]) => (
            <div key={date} className="relative">
              {/* Sticky Date Header */}
              <div className="sticky top-[72px] md:top-0 z-10 py-2 bg-background/95 backdrop-blur-sm -mx-4 px-4 md:mx-0 md:px-0 flex items-center justify-between border-b border-border/40 mb-2">
                <h3 className="text-sm font-semibold text-primary">{getDateLabel(new Date(date))}</h3>
                <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                  {formatCurrency(list.reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0))}
                </span>
              </div>

              {/* Transactions List */}
              <div className="space-y-2">
                {list.map((transaction) => {
                  const isSelected = selectedIds.has(transaction.id);

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={transaction.id}
                      className={cn(
                        "group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                        "hover:border-primary/30 hover:shadow-sm hover:bg-muted/20",
                        isSelected ? "border-primary bg-primary/5" : "border-border/40 bg-card"
                      )}
                      onClick={() => {
                        if (isBatchMode) toggleSelection(transaction.id);
                        else {
                          setEditingTransaction(transaction);
                          setModalOpen(true);
                        }
                      }}
                    >
                      {/* Selection Checkbox (Visible in Batch Mode) */}
                      <AnimatePresence>
                        {isBatchMode && (
                          <motion.div
                            initial={{ width: 0, opacity: 0, paddingRight: 0 }}
                            animate={{ width: 'auto', opacity: 1, paddingRight: 12 }}
                            exit={{ width: 0, opacity: 0, paddingRight: 0 }}
                            className="overflow-hidden"
                          >
                            <div className={cn(
                              "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                              isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                            )}>
                              {isSelected && <Check className="w-3 h-3 text-[#101010]" strokeWidth={4} />}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Icon */}
                      <div
                        className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                        style={{ backgroundColor: `${transaction.category.color}20` }}
                      >
                        <CategoryIcon
                          icon={transaction.category.icon}
                          color={transaction.category.color}
                          size="sm"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-medium truncate pr-2 text-sm md:text-base">
                            {transaction.notes || transaction.category.name}
                          </p>
                          <p className={cn(
                            "font-bold whitespace-nowrap text-sm md:text-base",
                            transaction.type === 'income' ? "text-green-500" : ""
                          )}>
                            {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {transaction.category.name} • {format(new Date(transaction.date), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          {isLoading && <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
        </div>
      </div>

      {/* --- BATCH ACTION BAR --- */}
      <AnimatePresence>
        {isBatchMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[400px] z-50 origin-bottom"
          >
            <div className="bg-foreground text-background rounded-2xl p-4 shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-background/20 px-3 py-1 rounded-lg text-sm font-bold">
                  {selectedIds.size} selected
                </div>
                <p className="text-sm font-medium opacity-80 hidden sm:block">
                  Select more or choose an action
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSelectedIds(new Set())}>
                  Clear
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBatchDelete} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transaction={editingTransaction}
      />
    </PageTransition>
  );
}
