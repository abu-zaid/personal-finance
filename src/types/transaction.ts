// Transaction Types
export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
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
  type: TransactionType;
  categoryId: string;
  date: Date;
  notes?: string;
}

export interface UpdateTransactionInput {
  amount?: number;
  type?: TransactionType;
  categoryId?: string;
  date?: Date;
  notes?: string;
}

export interface TransactionFilters {
  startDate?: string | Date;
  endDate?: string | Date;
  categoryIds?: string[]; // Changed from categoryId to support multiple categories
  type?: 'all' | 'income' | 'expense'; // Added type filter
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
