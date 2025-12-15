// Budget Types
export interface Budget {
  id: string;
  userId: string;
  month: string; // Format: 'YYYY-MM' (e.g., '2025-12')
  totalAmount: number;
  allocations: BudgetAllocation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetAllocation {
  categoryId: string;
  amount: number;
  spent?: number; // Calculated field (sum of transactions)
  remaining?: number; // Calculated field (amount - spent)
}

export interface BudgetWithSpending extends Budget {
  totalSpent: number;
  totalRemaining: number;
  allocations: BudgetAllocationWithSpending[];
}

export interface BudgetAllocationWithSpending extends BudgetAllocation {
  spent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
}

export interface CreateBudgetInput {
  month: string;
  totalAmount: number;
  allocations: Omit<BudgetAllocation, 'spent' | 'remaining'>[];
}

export interface UpdateBudgetInput {
  totalAmount?: number;
  allocations?: Omit<BudgetAllocation, 'spent' | 'remaining'>[];
}
