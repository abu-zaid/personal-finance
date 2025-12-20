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

          {/* NEW: Monthly Trend Sparkline */}
          {monthlyTrend.some(v => v > 0) && (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs text-muted-foreground">30-Day Trend</p>
                    <p className="text-lg font-bold">{formatCurrency(getMonthlyTotal(currentMonth))}</p>
                  </div>
                  <div className="w-32 h-12">
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

          {/* CATEGORY FILTERS */}
          <div className="relative -mx-4 px-4 overflow-x-auto">
            <div className="flex w-max min-w-full gap-2 pb-2">
              <Badge
                onClick={() => setCategoryFilter('all')}
                variant={categoryFilter === 'all' ? 'default' : 'outline'}
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
                <div className="flex justify-between mb-2 px-1">
                  <span className="text-sm font-semibold">
                    {getDateLabel(date)}
                  </span>
                  <span className="text-xs text-muted-foreground">
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
                      <div
                        className="flex gap-3 min-w-0 cursor-pointer"
                        onClick={() => {
                          setEditingTransaction(t);
                          setModalOpen(true);
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
