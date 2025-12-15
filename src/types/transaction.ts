// Transaction Types
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  categoryId: string;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionWithCategory extends Transaction {
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

export interface CreateTransactionInput {
  amount: number;
  categoryId: string;
  date: Date;
  notes?: string;
}

export interface UpdateTransactionInput {
  amount?: number;
  categoryId?: string;
  date?: Date;
  notes?: string;
}

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export type TransactionSortField = 'date' | 'amount' | 'category';
export type SortOrder = 'asc' | 'desc';

export interface TransactionSort {
  field: TransactionSortField;
  order: SortOrder;
}
