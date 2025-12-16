'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { format, isToday, isYesterday, subMonths } from 'date-fns';
import { motion } from 'framer-motion';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/animations';
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

export default function TransactionsPage() {
  const { 
    transactions, 
    deleteTransaction, 
    getMonthlyTotal,
    hasMore,
    loadMore,
    isLoading,
    totalCount 
  } = useTransactions();
  const { categories } = useCategories();
  const { formatCurrency } = useCurrency();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const currentMonth = getMonthString(new Date());
  const previousMonth = getMonthString(subMonths(new Date(), 1));

  // Infinite scroll handler
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    await loadMore();
    setIsLoadingMore(false);
  }, [loadMore, hasMore, isLoadingMore]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, handleLoadMore]);

  // Get unique months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((t) => {
      months.add(getMonthString(new Date(t.date)));
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesNotes = t.notes?.toLowerCase().includes(query);
        const matchesCategory = t.category?.name.toLowerCase().includes(query);
        if (!matchesNotes && !matchesCategory) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && t.categoryId !== categoryFilter) {
        return false;
      }

      // Month filter
      if (monthFilter !== 'all') {
        const transactionMonth = getMonthString(new Date(t.date));
        if (transactionMonth !== monthFilter) return false;
      }

      return true;
    });
  }, [transactions, searchQuery, categoryFilter, monthFilter]);

  // Sort by date (most recent first)
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredTransactions]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, TransactionWithCategory[]> = {};
    sortedTransactions.forEach((t) => {
      const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });
    return groups;
  }, [sortedTransactions]);

  // Stats
  const currentMonthTotal = getMonthlyTotal(currentMonth);
  const previousMonthTotal = getMonthlyTotal(previousMonth);
  const monthChange = previousMonthTotal > 0
    ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
    : 0;

  // Categories with spending for quick filters
  const categoriesWithSpending = useMemo(() => {
    const spending = new Map<string, number>();
    transactions.forEach((t) => {
      const current = spending.get(t.categoryId) || 0;
      spending.set(t.categoryId, current + t.amount);
    });
    return categories
      .filter((c) => spending.has(c.id))
      .sort((a, b) => (spending.get(b.id) || 0) - (spending.get(a.id) || 0))
      .slice(0, 6);
  }, [transactions, categories]);

  const handleDeleteClick = async (id: string) => {
    await deleteTransaction(id);
  };

  const handleEditClick = (transaction: TransactionWithCategory) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setEditingTransaction(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setMonthFilter('all');
  };

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || monthFilter !== 'all';

  // Format date label
  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
  };

  // Get day total
  const getDayTotal = (dayTransactions: TransactionWithCategory[]) => {
    return dayTransactions.reduce((sum, t) => sum + t.amount, 0);
  };

  const totalFiltered = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <ErrorBoundary>
      <PageTransition>
        <div className="space-y-4 pb-20 lg:pb-4">
          {/* Header with Stats */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold lg:text-2xl">Transactions</h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                {format(new Date(), 'MMMM yyyy')} • {totalCount} total
              </p>
            </div>
            <button
              onClick={handleAddClick}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
              style={{
                background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
                boxShadow: '0 0 12px rgba(152, 239, 90, 0.25)',
              }}
            >
              <Plus className="h-4 w-4 text-[#101010]" />
            </button>
          </div>

          {/* Stats Cards */}
          <StaggerContainer>
            <div className="grid grid-cols-2 gap-3">
              <StaggerItem>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Wallet className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">This Month</span>
                    </div>
                    <p className="text-base sm:text-lg font-bold">{formatCurrency(currentMonthTotal)}</p>
                    <div className="flex items-center mt-1 text-xs">
                      {monthChange > 0 ? (
                        <span className="text-destructive flex items-center">
                          <TrendingUp className="h-3 w-3 mr-0.5" />
                          +{monthChange.toFixed(0)}%
                        </span>
                      ) : monthChange < 0 ? (
                        <span className="text-primary flex items-center">
                          <TrendingDown className="h-3 w-3 mr-0.5" />
                          {monthChange.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">vs last month</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/10">
                        <ListOrdered className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">Transactions</span>
                    </div>
                    <p className="text-lg font-bold">{filteredTransactions.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(totalFiltered)} total
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            </div>
          </StaggerContainer>

          {/* Search & Filters */}
          <FadeIn>
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Quick Category Filters */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <Badge
                  variant={categoryFilter === 'all' ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer whitespace-nowrap transition-all",
                    categoryFilter === 'all' 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => setCategoryFilter('all')}
                >
                  All
                </Badge>
                {categoriesWithSpending.map((category) => (
                  <Badge
                    key={category.id}
                    variant={categoryFilter === category.id ? 'default' : 'outline'}
                    className={cn(
                      "cursor-pointer whitespace-nowrap transition-all flex items-center gap-1.5",
                      categoryFilter === category.id 
                        ? "" 
                        : "hover:bg-muted"
                    )}
                    style={categoryFilter === category.id ? { 
                      backgroundColor: category.color,
                      color: '#101010',
                      borderColor: category.color,
                    } : undefined}
                    onClick={() => setCategoryFilter(
                      categoryFilter === category.id ? 'all' : category.id
                    )}
                  >
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </Badge>
                ))}
              </div>

              {/* Month Filter & Clear */}
              <div className="flex items-center gap-2">
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    {availableMonths.map((month) => (
                      <SelectItem key={month} value={month}>
                        {format(new Date(month + '-01'), 'MMMM yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </FadeIn>

          {/* Transactions List */}
          {sortedTransactions.length === 0 && !isLoading ? (
            <FadeIn>
              <Card className="py-12">
                <EmptyState
                  icon={<ListOrdered className="h-10 w-10" />}
                  title={hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
                  description={
                    hasActiveFilters
                      ? 'Try adjusting your filters or search query.'
                      : 'Start tracking your expenses by adding your first transaction.'
                  }
                  action={
                    hasActiveFilters 
                      ? { label: 'Clear Filters', onClick: clearFilters }
                      : { label: 'Add Transaction', onClick: handleAddClick }
                  }
                />
              </Card>
            </FadeIn>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedTransactions).map(([date, dayTransactions], groupIndex) => (
                <FadeIn key={date}>
                  <div>
                    {/* Date Header */}
                    <div className="flex items-center justify-between mb-2 px-1">
                      <h3 className="text-sm font-semibold text-foreground">
                        {getDateLabel(date)}
                      </h3>
                      <span className="text-xs text-muted-foreground font-medium">
                        {formatCurrency(getDayTotal(dayTransactions))}
                      </span>
                    </div>

                    {/* Transactions Card */}
                    <Card className="p-0 overflow-hidden">
                      {dayTransactions.map((transaction, index) => (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ delay: groupIndex * 0.05 + index * 0.03 }}
                          className={cn(
                            "group flex items-center justify-between p-4 transition-colors hover:bg-muted/30",
                            index !== dayTransactions.length - 1 && "border-b border-border/50"
                          )}
                        >
                          <div 
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleEditClick(transaction)}
                          >
                            <div 
                              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 hover:scale-105"
                              style={{
                                background: transaction.category?.color 
                                  ? `${transaction.category.color}15` 
                                  : 'var(--muted)',
                              }}
                            >
                              {transaction.category && (
                                <CategoryIcon
                                  icon={transaction.category.icon}
                                  color={transaction.category.color}
                                  size="md"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {transaction.notes || transaction.category?.name || 'Expense'}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span 
                                  className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                                >
                                  <span 
                                    className="w-1.5 h-1.5 rounded-full" 
                                    style={{ backgroundColor: transaction.category?.color }}
                                  />
                                  {transaction.category?.name}
                                </span>
                                <span className="text-muted-foreground/40">·</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(transaction.date), 'h:mm a')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn(
                              "text-sm font-semibold",
                              transaction.type === 'income' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-destructive'
                            )}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 lg:opacity-0 lg:group-hover:opacity-100 lg:hover:opacity-100 lg:focus:opacity-100"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditClick(transaction)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(transaction.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </motion.div>
                      ))}
                    </Card>
                  </div>
                </FadeIn>
              ))}

              {/* Load More Trigger */}
              {hasMore && (
                <div 
                  ref={loadMoreRef} 
                  className="flex items-center justify-center py-4"
                >
                  {isLoadingMore && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading more...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Desktop Add Button */}
          <div className="hidden lg:block fixed bottom-8 right-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddClick}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-medium text-[#101010] shadow-xl"
              style={{
                background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
                boxShadow: '0 8px 32px rgba(152, 239, 90, 0.4)',
              }}
            >
              <Plus className="h-5 w-5" />
              Add Transaction
            </motion.button>
          </div>

          {/* Transaction Modal (Add/Edit) */}
          <TransactionModal 
            open={modalOpen} 
            onOpenChange={handleModalClose}
            transaction={editingTransaction}
          />
        </div>
      </PageTransition>
    </ErrorBoundary>
  );
}
