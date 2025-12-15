'use client';

import { useState, useMemo } from 'react';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/shared';
import { CategoryIcon } from '@/components/features/categories';
import { AddTransactionModal } from '@/components/features/transactions';
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
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { TransactionWithCategory } from '@/types';

export default function TransactionsPage() {
  const { transactions, deleteTransaction, getMonthlyTotal } = useTransactions();
  const { categories } = useCategories();
  const { formatCurrency } = useCurrency();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const currentMonth = getMonthString(new Date());
  const previousMonth = getMonthString(subMonths(new Date(), 1));

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

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (transactionToDelete) {
      try {
        await deleteTransaction(transactionToDelete);
        toast.success('Transaction deleted');
      } catch {
        toast.error('Failed to delete transaction');
      }
    }
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
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
    <PageTransition>
      <div className="space-y-4 pb-20 lg:pb-4">
        {/* Header with Stats */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-h1 lg:text-2xl lg:font-bold">Transactions</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {format(new Date(), 'MMMM yyyy')}
            </p>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
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
                  <p className="text-lg font-bold">{formatCurrency(currentMonthTotal)}</p>
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
        {sortedTransactions.length === 0 ? (
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
                    : { label: 'Add Transaction', onClick: () => setAddModalOpen(true) }
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
                        transition={{ delay: groupIndex * 0.05 + index * 0.03 }}
                        className={cn(
                          "flex items-center justify-between p-4 transition-colors hover:bg-muted/30",
                          index !== dayTransactions.length - 1 && "border-b border-border/50"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
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
                          <span className="text-sm font-semibold text-destructive">
                            -{formatCurrency(transaction.amount)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
          </div>
        )}

        {/* Desktop Add Button */}
        <div className="hidden lg:block fixed bottom-8 right-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAddModalOpen(true)}
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

        {/* Add Transaction Modal */}
        <AddTransactionModal open={addModalOpen} onOpenChange={setAddModalOpen} />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this transaction? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
