'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { PageTransition, FadeIn } from '@/components/animations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useTransactions } from '@/context/transactions-context';
import { useCategories } from '@/context/categories-context';
import { formatCurrency, getMonthString } from '@/lib/utils';
import {
  ListOrdered,
  Search,
  MoreVertical,
  Trash2,
  Calendar,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { TransactionWithCategory } from '@/types';

export default function TransactionsPage() {
  const { transactions, deleteTransaction } = useTransactions();
  const { categories } = useCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

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

  const totalFiltered = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header - Mobile style */}
        <div className="lg:hidden">
          <h1 className="text-h1">Transactions</h1>
          <p className="text-muted-foreground text-sm">
            {filteredTransactions.length} transactions · {formatCurrency(totalFiltered)}
          </p>
        </div>

        {/* Header - Desktop */}
        <div className="hidden lg:block">
          <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">View and manage all your expenses</p>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Month Filter */}
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Month" />
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
          </div>
        </Card>

        {/* Transactions List */}
        {sortedTransactions.length === 0 ? (
          <Card className="py-12">
            <EmptyState
              icon={<ListOrdered className="h-12 w-12" />}
              title={searchQuery || categoryFilter !== 'all' || monthFilter !== 'all'
                ? 'No matching transactions'
                : 'No transactions yet'}
              description={searchQuery || categoryFilter !== 'all' || monthFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Start tracking your expenses by adding your first transaction.'}
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
              <FadeIn key={date}>
                <div>
                  <h3 className="text-muted-foreground mb-2 text-caption font-medium px-1">
                    {format(new Date(date), 'EEEE, MMMM d')}
                  </h3>
                  <Card className="divide-y divide-border p-0 overflow-hidden">
                    {dayTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 transition-colors hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background border border-border">
                            {transaction.category && (
                              <CategoryIcon
                                icon={transaction.category.icon}
                                color={transaction.category.color}
                                size="sm"
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {transaction.notes || transaction.category?.name || 'Expense'}
                            </p>
                            <p className="text-caption text-muted-foreground">
                              {transaction.category?.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-destructive">
                            -{formatCurrency(transaction.amount)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(transaction.id)}
                                className="text-destructive"
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
              </FadeIn>
            ))}
          </div>
        )}

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
