'use client';

import { useState } from 'react';

import { PageTransition } from '@/components/animations';
import { TransactionModal } from '@/components/features/transactions';
import { TransactionWithCategory } from '@/types';
import { Stack } from '@/components/ui/layout';

import { useTransactionsView } from '@/hooks/use-transactions-view';
import { TransactionsHeader } from '@/components/features/transactions/transactions-header';
import { TransactionsToolbar } from '@/components/features/transactions/transactions-toolbar';
import { TransactionList } from '@/components/features/transactions/transaction-list';
import { BatchActions } from '@/components/features/transactions/batch-actions';

import { DeleteTransactionDialog } from '@/components/features/transactions/delete-transaction-dialog';

export default function TransactionsPage() {
  const view = useTransactionsView();

  // Modal State (UI only)
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);

  const handleCreate = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const handleEdit = (transaction: TransactionWithCategory) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  return (
    <PageTransition className="h-full w-full bg-background">
      {/* Scrollable Content */}
      <Stack className="h-full overflow-y-auto overflow-x-hidden pb-24 md:pb-6" gap={0}>
        {/* Header */}
        <TransactionsHeader
          isLoading={view.isInitialLoading}
          stats={view.stats}
          onAddTransaction={handleCreate}
        />

        {/* Toolbar (Search, Filter, Sort, Batch Toggle) */}
        {!view.isInitialLoading && (
          <TransactionsToolbar
            search={view.search}
            onSearchChange={view.setSearch}
            filters={view.filters}
            onFilterChange={view.onFilterChange}
            onClearFilters={view.onClearFilters}
            sortConfig={view.sortConfig}
            onSortChange={view.setSortConfig}
            isBatchMode={view.isBatchMode}
            onToggleBatchMode={() => view.setIsBatchMode(!view.isBatchMode)}
            categories={view.categories}
            activeFilterCount={view.activeFilterCount}
          />
        )}

        {/* List */}
        <TransactionList
          groupedTransactions={view.groupedTransactions}
          isLoading={view.isLoading}
          hasMore={view.hasMore}
          onLoadMore={view.onLoadMore}
          onClearFilters={view.onClearFilters}
          selectedIds={view.selectedIds}
          isBatchMode={view.isBatchMode}
          onToggleSelection={view.onToggleSelection}
          onEdit={handleEdit}
          onDelete={view.onDelete}
        />
      </Stack>

      {/* Floating Batch Actions */}
      <BatchActions
        isVisible={view.isBatchMode && view.selectedIds.size > 0}
        selectedCount={view.selectedIds.size}
        onClearSelection={() => view.setSelectedIds(new Set())}
        onDelete={() => setDeleteAlertOpen(true)}
      />

      {/* Edit/Create Modal */}
      <TransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transaction={editingTransaction}
      />

      {/* Delete Confirmation Alert */}
      <DeleteTransactionDialog
        open={deleteAlertOpen}
        onOpenChange={setDeleteAlertOpen}
        onConfirm={view.onBatchDelete}
        count={view.selectedIds.size}
      />
    </PageTransition>
  );
}
