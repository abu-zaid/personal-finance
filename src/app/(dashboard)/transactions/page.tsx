'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { format, isToday, isYesterday, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Check,
  Trash2,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { TransactionWithCategory, TransactionSort } from '@/types';
import {
  setFilters,
  fetchTransactions,
  deleteTransaction,
  fetchMonthlyAggregates,
  selectTransactions,
  selectTransactionsStatus,
  selectTransactionsError,
  selectMonthlyAggregates
} from '@/lib/features/transactions/transactionsSlice';
import { selectCategories } from '@/lib/features/categories/categoriesSlice';
import { APP_NAME, BRAND_GRADIENT } from '@/lib/constants';
import { useAuth } from '@/context/auth-context';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { useCurrency } from '@/hooks/use-currency';
import { useMediaQuery } from '@/hooks/use-media-query';

// UI Components
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionSkeleton } from '@/components/skeletons/skeleton-loaders';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Separator } from '@/components/ui/separator';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { PageTransition, AnimatedNumber } from '@/components/animations';
import { CategoryIcon } from '@/components/features/categories';
import { TransactionModal } from '@/components/features/transactions';

export default function TransactionsPage() {
  // Redux & Context
  const dispatch = useAppDispatch();
  const transactions = useAppSelector(selectTransactions);
  const status = useAppSelector(selectTransactionsStatus);
  const error = useAppSelector(selectTransactionsError);
  const categories = useAppSelector(selectCategories);
  const { hasMore, filters: currentFilters, totalCount } = useAppSelector((state) => state.transactions);

  const isLoading = status === 'loading' && transactions.length === 0;

  const { formatCurrency, symbol } = useCurrency();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Monthly totals from Redux
  const aggregates = useAppSelector(selectMonthlyAggregates);
  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthlyIncome = aggregates.monthlyIncome[currentMonth] || 0;
  const monthlyExpense = aggregates.monthlyExpenses[currentMonth] || 0;

  // Sync monthly totals when month changes
  const fetchMonthlyTotals = useCallback(() => {
    dispatch(fetchMonthlyAggregates({ month: currentMonth, type: 'income' }));
    dispatch(fetchMonthlyAggregates({ month: currentMonth, type: 'expense' }));
  }, [currentMonth, dispatch]);

  useEffect(() => {
    fetchMonthlyTotals();
  }, [fetchMonthlyTotals]);

  // Initial Fetch - Fix for race condition
  // We need to access the user from the store or hook to verify they are logged in before fetching
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchTransactions({ page: 0 }));
    }
  }, [dispatch, user?.id]);

  // Local State
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);

  // Local Sort State (can stay local as it operates on loaded data)
  const [sortConfig, setSortConfig] = useState<TransactionSort>({ field: 'date', order: 'desc' });

  // Infinite Scroll Ref
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---

  // Use transactions directly from context (already filtered by DB)
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Additional client-side sort if needed
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
  }, [transactions, sortConfig]);

  const loadMore = useCallback(() => {
    if (hasMore && status !== 'loading') {
      const nextPage = Math.ceil(transactions.length / 20);
      dispatch(fetchTransactions({ page: nextPage, append: true }));
    }
  }, [hasMore, status, transactions.length, dispatch]);

  const handleScroll = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && !isLoading) {
      loadMore();
    }
  }, [isLoading, loadMore]);

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

  // Statistics - use monthly totals from database
  const stats = useMemo(() => {
    return {
      income: monthlyIncome,
      expense: monthlyExpense,
      net: monthlyIncome - monthlyExpense
    };
  }, [monthlyIncome, monthlyExpense]);

  // --- Handlers ---

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBatchDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} transactions?`)) return;

    const ids = Array.from(selectedIds);
    setSelectedIds(new Set());
    setIsBatchMode(false);

    try {
      await Promise.all(ids.map(id => dispatch(deleteTransaction(id)).unwrap()));
      toast.success(`Deleted ${ids.length} transactions`);
    } catch (err) {
      toast.error("Some transactions failed to delete");
    }
  };

  // Helper to update specific filters
  const updateFilters = (updates: Partial<typeof currentFilters>) => {
    const newFilters = { ...currentFilters, ...updates };
    dispatch(setFilters(newFilters));
    dispatch(fetchTransactions({ page: 0 }));
  };

  const clearFilters = () => {
    dispatch(setFilters({}));
    setSortConfig({ field: 'date', order: 'desc' });
    dispatch(fetchTransactions({ page: 0 }));
  };

  const activeFilterCount = [
    currentFilters.startDate || currentFilters.endDate,
    (currentFilters.categoryIds?.length || 0) > 0,
    currentFilters.type && currentFilters.type !== 'all'
  ].filter(Boolean).length;

  // Loading State
  if (isLoading) {
    return (
      <PageTransition className="flex flex-col h-full w-full overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Header */}
          <div className="px-4 md:px-6 py-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">Transactions</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="hidden md:flex h-9 rounded-full border-border/60" disabled>
                  <p className="mr-2">Export</p>
                </Button>
                <Button size="sm" className="h-9 w-9 p-0 rounded-full" disabled>
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <Card className="shadow-none border-border/40 bg-card/50">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Income</p>
                  <Skeleton className="h-7 w-24" />
                </CardContent>
              </Card>
              <Card className="shadow-none border-border/40 bg-card/50">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Expenses</p>
                  <Skeleton className="h-7 w-24" />
                </CardContent>
              </Card>
              <Card className="shadow-none border-border/40 bg-card/50">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Net</p>
                  <Skeleton className="h-7 w-24" />
                </CardContent>
              </Card>
            </div>

            {/* Search Skeleton */}
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          {/* Content Skeleton */}
          <div className="px-4 md:px-6 pb-6 max-w-full space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <TransactionSkeleton key={i} />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Header - Not Sticky */}
        <div className="px-4 md:px-6 py-4 space-y-4">
          {/* Title & Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">Transactions</h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
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
                          value={currentFilters.type || 'all'}
                          onValueChange={(v) => updateFilters({ type: v as 'all' | 'income' | 'expense' })}
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
                            onClick={() => setSortConfig({
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
                            onClick={() => setSortConfig({
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
                            variant="outline"
                            size="sm"
                            onClick={() => updateFilters({ startDate: undefined, endDate: undefined })}
                            className={cn(!currentFilters.startDate && "bg-secondary")}
                          >
                            All Time
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFilters({
                              startDate: startOfMonth(new Date()).toISOString(),
                              endDate: endOfMonth(new Date()).toISOString()
                            })}
                          >
                            This Month
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFilters({
                              startDate: subDays(new Date(), 30).toISOString(),
                              endDate: new Date().toISOString()
                            })}
                          >
                            Last 30 Days
                          </Button>
                        </div>
                        {currentFilters.startDate && (
                          <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-2 rounded-md">
                            <CalendarIcon className="h-4 w-4" />
                            <span>
                              {format(new Date(currentFilters.startDate!), 'MMM d')} - {currentFilters.endDate ? format(new Date(currentFilters.endDate), 'MMM d, yyyy') : 'Now'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 ml-auto hover:bg-primary/20"
                              onClick={() => updateFilters({ startDate: undefined, endDate: undefined })}
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
                            const isSelected = (currentFilters.categoryIds || []).includes(cat.id);
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
                                  const current = currentFilters.categoryIds || [];
                                  if (isSelected) {
                                    updateFilters({ categoryIds: current.filter((id: string) => id !== cat.id) });
                                  } else {
                                    updateFilters({ categoryIds: [...current, cat.id] });
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
                    <Button variant="outline" onClick={clearFilters} className="flex-1 h-11 sm:h-10">
                      Reset
                    </Button>
                    <SheetClose asChild>
                      <Button className="flex-1 h-11 sm:h-10 text-[#101010] border-0 hover:opacity-90 transition-opacity"
                        style={{ background: BRAND_GRADIENT.css }}>
                        Apply Filters
                      </Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              <Button
                variant={isBatchMode ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => {
                  setIsBatchMode(!isBatchMode);
                  setSelectedIds(new Set());
                }}
              >
                {isBatchMode ? 'Done' : 'Select'}
              </Button>

              <Button
                size="sm"
                className="h-9 w-9 p-0 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-[#101010]"
                style={{ background: BRAND_GRADIENT.css }}
                onClick={() => {
                  setEditingTransaction(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-5 w-5" strokeWidth={3} />
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-full min-w-0">
            <Card className="border-border/40 min-w-0">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <span className="text-[10px] md:text-xs text-muted-foreground font-medium truncate">Income</span>
                </div>
                <p className="text-sm md:text-xl font-bold text-green-500 tabular-nums truncate">
                  {symbol}<AnimatedNumber value={stats.income} />
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/40 min-w-0">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </div>
                  <span className="text-[10px] md:text-xs text-muted-foreground font-medium truncate">Expense</span>
                </div>
                <p className="text-sm md:text-xl font-bold text-red-500 tabular-nums truncate">
                  {symbol}<AnimatedNumber value={stats.expense} />
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/40 min-w-0">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-[10px] md:text-xs text-muted-foreground font-medium truncate">Net</span>
                </div>
                <p className={cn(
                  "text-sm md:text-xl font-bold tabular-nums truncate",
                  stats.net >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {stats.net >= 0 ? '+' : ''}{symbol}<AnimatedNumber value={Math.abs(stats.net)} />
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={currentFilters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        {/* Quick Category Filters - STICKY */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40 w-full overflow-x-auto scrollbar-hide px-4 md:px-6 py-3">
          <div className="flex items-center gap-2 w-fit max-w-[90vw]">
            <Button
              variant={(currentFilters.categoryIds || []).length === 0 ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilters({ categoryIds: [] })}
              className="flex-shrink-0"
            >
              All
            </Button>
            {categories.map(cat => {
              const isSelected = (currentFilters.categoryIds || []).includes(cat.id);
              return (
                <Button
                  key={cat.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const current = currentFilters.categoryIds || [];
                    if (isSelected) {
                      updateFilters({ categoryIds: current.filter((id: string) => id !== cat.id) });
                    } else {
                      updateFilters({ categoryIds: [...current, cat.id] });
                    }
                  }}
                  className="flex-shrink-0 gap-1.5 whitespace-nowrap"
                  style={isSelected ? { backgroundColor: cat.color, borderColor: cat.color, color: '#000' } : {}}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isSelected ? '#000' : cat.color }}
                  />
                  {cat.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Transaction List */}
        <div className="px-4 md:px-6 pb-6 max-w-full">
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
            <div className="space-y-6 mt-4">
              {Object.entries(groupedTransactions).map(([date, list]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="sticky top-0 z-10 py-2 bg-background/95 backdrop-blur-sm flex items-center justify-between border-b border-border/40 mb-3">
                    <h3 className="text-sm font-semibold text-primary">
                      {getDateLabel(new Date(date))}
                    </h3>
                    <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                      {formatCurrency(list.reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0))}
                    </span>
                  </div>

                  {/* Transactions */}
                  <div className="space-y-2">
                    {list.map((transaction) => {
                      const isSelected = selectedIds.has(transaction.id);

                      return (
                        <motion.div
                          key={transaction.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="max-w-full"
                        >
                          <Card
                            className={cn(
                              "group cursor-pointer transition-all duration-200 border-border/40 max-w-full",
                              "hover:border-primary/30 hover:shadow-md",
                              isSelected && "border-primary bg-primary/5"
                            )}
                            onClick={() => {
                              if (isBatchMode) toggleSelection(transaction.id);
                              else {
                                setEditingTransaction(transaction);
                                setModalOpen(true);
                              }
                            }}
                          >
                            <CardContent className="p-3 md:p-4">
                              <div className="flex items-center gap-3">
                                {/* Checkbox */}
                                <AnimatePresence>
                                  {isBatchMode && (
                                    <motion.div
                                      initial={{ width: 0, opacity: 0 }}
                                      animate={{ width: 'auto', opacity: 1 }}
                                      exit={{ width: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div
                                        className={cn(
                                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer",
                                          isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                        )}
                                        onClick={(e: React.MouseEvent) => {
                                          e.stopPropagation();
                                          toggleSelection(transaction.id);
                                        }}
                                      >
                                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={4} />}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Icon */}
                                <div
                                  className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
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
                                  <div className="flex justify-between items-start gap-2">
                                    <p className="font-semibold truncate text-sm md:text-base">
                                      {transaction.notes || transaction.category.name}
                                    </p>
                                    <p className={cn(
                                      "font-bold whitespace-nowrap text-sm md:text-base tabular-nums",
                                      transaction.type === 'income' ? "text-green-500" : ""
                                    )}>
                                      {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs text-muted-foreground truncate">
                                      {transaction.category.name}
                                    </p>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(transaction.date), 'h:mm a')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
            {isLoading && (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>
      </div>

      {/* Batch Action Bar */}
      <AnimatePresence>
        {isBatchMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[400px] z-50"
          >
            <Card className="bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 border-border/10 shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-white/20 dark:bg-black/10">
                      {selectedIds.size} selected
                    </Badge>
                    <p className="text-sm font-medium opacity-90 hidden sm:block">
                      Select more or choose an action
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedIds(new Set())}
                      className="text-current hover:bg-white/10 dark:hover:bg-black/10"
                    >
                      Clear
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBatchDelete}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <TransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transaction={editingTransaction}
      />
    </PageTransition >
  );
}
