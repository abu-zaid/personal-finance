'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { format, isToday, isYesterday, subMonths } from 'date-fns';
import { motion } from 'framer-motion';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/animations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState, ErrorBoundary } from '@/components/shared';
import { CategoryIcon } from '@/components/features/categories';
import { TransactionModal } from '@/components/features/transactions';
import { useTransactions } from '@/context/transactions-context';
import { useCategories } from '@/context/categories-context';
import { useCurrency } from '@/hooks/use-currency';
import { getMonthString, cn } from '@/lib/utils';
import {
  ListOrdered,
  Search,
  MoreVertical,
  Trash2,
  Calendar,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  X,
  Pencil,
  Loader2,
} from 'lucide-react';
import { TransactionWithCategory } from '@/types';
import { Sparkline } from '@/components/charts';

export default function TransactionsPage() {
  const {
    transactions,
    deleteTransaction,
    getMonthlyTotal,
    hasMore,
    loadMore,
    isLoading,
    totalCount,
  } = useTransactions();

  const { categories } = useCategories();
  const { formatCurrency } = useCurrency();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionWithCategory | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const currentMonth = getMonthString(new Date());
  const previousMonth = getMonthString(subMonths(new Date(), 1));

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    await loadMore();
    setIsLoadingMore(false);
  }, [loadMore, hasMore, isLoadingMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, handleLoadMore]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((t) =>
      months.add(getMonthString(new Date(t.date)))
    );
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !t.notes?.toLowerCase().includes(q) &&
          !t.category?.name.toLowerCase().includes(q)
        )
          return false;
      }
      if (categoryFilter !== 'all' && t.categoryId !== categoryFilter)
        return false;
      if (monthFilter !== 'all') {
        if (getMonthString(new Date(t.date)) !== monthFilter) return false;
      }
      return true;
    });
  }, [transactions, searchQuery, categoryFilter, monthFilter]);

  const sortedTransactions = useMemo(
    () =>
      [...filteredTransactions].sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [filteredTransactions]
  );

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, TransactionWithCategory[]> = {};
    sortedTransactions.forEach((t) => {
      const key = format(new Date(t.date), 'yyyy-MM-dd');
      (groups[key] ||= []).push(t);
    });
    return groups;
  }, [sortedTransactions]);

  const categoriesWithSpending = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((t) =>
      map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount)
    );
    return categories
      .filter((c) => map.has(c.id))
      .sort((a, b) => map.get(b.id)! - map.get(a.id)!)
      .slice(0, 6);
  }, [transactions, categories]);

  const hasActiveFilters =
    searchQuery || categoryFilter !== 'all' || monthFilter !== 'all';

  const getDateLabel = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'EEEE, MMMM d');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} transactions?`)) {
      for (const id of selectedIds) {
        await deleteTransaction(id);
      }
      setSelectedIds(new Set());
      setIsBatchMode(false);
    }
  };

  // NEW: Monthly spending trend (last 30 days)
  const monthlyTrend = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTotal = transactions
        .filter(t => {
          const tDate = new Date(t.date);
          return tDate.toDateString() === date.toDateString();
        })
        .reduce((sum, t) => sum + t.amount, 0);
      days.push(dayTotal);
    }
    return days;
  }, [transactions]);

  return (
    <ErrorBoundary>
      <PageTransition>
        {/* 🔒 ROOT CLAMP */}
        <div className="relative w-full overflow-x-hidden space-y-4 pb-24">
          {/* HEADER */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold">Transactions</h1>
              <p className="text-xs text-muted-foreground">
                {format(new Date(), 'MMMM yyyy')} • {totalCount} total
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsBatchMode(!isBatchMode);
                  if (isBatchMode) setSelectedIds(new Set());
                }}
                className={cn(
                  "text-xs font-semibold rounded-lg h-9 px-3 transition-colors",
                  isBatchMode ? "bg-primary/20 text-primary" : "text-muted-foreground"
                )}
              >
                {isBatchMode ? 'Cancel' : 'Select'}
              </Button>
              <button
                onClick={() => setModalOpen(true)}
                className="lg:hidden h-9 w-9 rounded-xl shadow-lg flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
                }}
              >
                <Plus className="h-4 w-4 text-[#101010]" />
              </button>
            </div>
          </div>

          {/* BATCH ACTIONS BAR */}
          {isBatchMode && selectedIds.size > 0 && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="fixed bottom-24 left-4 right-4 lg:left-1/2 lg:-translate-x-1/2 lg:w-max z-50"
            >
              <Card className="shadow-2xl border-primary/20 bg-background/80 backdrop-blur-md">
                <CardContent className="p-3 flex items-center gap-4">
                  <span className="text-sm font-bold ml-2">
                    {selectedIds.size} selected
                  </span>
                  <div className="h-4 w-px bg-border mx-1" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-9 px-4 rounded-xl font-bold"
                    onClick={handleBatchDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-4 rounded-xl font-bold"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Clear
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* NEW: Monthly Trend Sparkline */}
          {monthlyTrend.some(v => v > 0) && (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="min-w-0 pr-4">
                    <p className="text-xs text-muted-foreground truncate">30-Day Trend</p>
                    <p className="text-lg font-bold truncate">{formatCurrency(getMonthlyTotal(currentMonth))}</p>
                  </div>
                  <div className="w-32 h-12 flex-shrink-0">
                    <Sparkline
                      data={monthlyTrend}
                      color="#98EF5A"
                      height={48}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SEARCH & MONTH FILTERS */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search transactions..."
                className="pl-9 h-11 rounded-xl bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[130px] h-11 rounded-xl bg-muted/40 border-none">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                {availableMonths.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CATEGORY FILTERS */}
          <div className="relative -mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex w-max min-w-full gap-2 pb-2">
              <Badge
                onClick={() => setCategoryFilter('all')}
                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer h-8 rounded-lg px-4"
              >
                All
              </Badge>
              {categoriesWithSpending.map((c) => (
                <Badge
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  style={{
                    backgroundColor:
                      categoryFilter === c.id ? c.color : undefined,
                    color:
                      categoryFilter === c.id ? '#101010' : undefined,
                  }}
                  className="cursor-pointer h-8 rounded-lg px-4"
                >
                  {c.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* TRANSACTIONS */}
          <div className="space-y-4 overflow-hidden">
            {Object.entries(groupedTransactions).map(([date, list]) => (
              <div key={date}>
                <div className="sticky top-0 z-10 py-2 -mx-4 px-4 bg-background/95 backdrop-blur-sm flex justify-between items-center border-b border-border/10">
                  <span className="text-sm font-bold text-primary flex items-center gap-2 truncate min-w-0">
                    <Calendar className="h-4 w-4 opacity-50 flex-shrink-0" />
                    <span className="truncate">{getDateLabel(date)}</span>
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md whitespace-nowrap ml-2">
                    {formatCurrency(
                      list.reduce((s, t) => s + t.amount, 0)
                    )}
                  </span>
                </div>

                <Card className="overflow-hidden">
                  {list.map((t, i) => (
                    <div
                      key={t.id}
                      className={cn(
                        'group flex justify-between items-center p-4',
                        i !== list.length - 1 && 'border-b'
                      )}
                    >
                      {/* LEFT */}
                      <div className="flex items-center gap-3 min-w-0">
                        {isBatchMode && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(t.id);
                            }}
                            className={cn(
                              "flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center cursor-pointer",
                              selectedIds.has(t.id)
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/30 hover:border-primary/50"
                            )}
                          >
                            {selectedIds.has(t.id) && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <Plus className="h-3 w-3 text-[#101010] rotate-45" />
                              </motion.div>
                            )}
                          </div>
                        )}
                        <div
                          className="flex gap-3 min-w-0 cursor-pointer"
                          onClick={() => {
                            if (isBatchMode) {
                              toggleSelect(t.id);
                            } else {
                              setEditingTransaction(t);
                              setModalOpen(true);
                            }
                          }}
                        >
                          <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center"
                            style={{
                              backgroundColor: `${t.category?.color}22`,
                            }}
                          >
                            <CategoryIcon
                              icon={t.category?.icon}
                              color={t.category?.color}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {t.notes || t.category?.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {t.category?.name}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {formatCurrency(t.amount)}
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="
                                h-8 w-8
                                lg:opacity-0
                                lg:group-hover:opacity-100
                                lg:focus:opacity-100
                              "
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingTransaction(t);
                                setModalOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => deleteTransaction(t.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            ))}
          </div>

          <TransactionModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            transaction={editingTransaction}
          />
        </div>
      </PageTransition>
    </ErrorBoundary>
  );
}
