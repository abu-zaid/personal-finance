// Summary Types - Computed/Cached data for insights
export interface MonthlySummary {
  userId: string;
  month: string; // 'YYYY-MM'
  totalSpent: number;
  totalBudget: number;
  transactionCount: number;
  categoryBreakdown: CategorySpending[];
  topCategory: TopCategory | null;
  dailySpending: DailySpending[];
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percentage: number; // % of total spending
  budgetAmount?: number;
  isOverBudget: boolean;
}

export interface TopCategory {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
}

export interface DailySpending {
  date: string; // 'YYYY-MM-DD'
  amount: number;
}

export interface SpendingTrend {
  month: string;
  totalSpent: number;
  totalBudget: number;
  percentageChange: number; // vs previous month
}

export interface InsightsSummary {
  currentMonth: MonthlySummary;
  previousMonth: MonthlySummary | null;
  trends: SpendingTrend[];
  averageMonthlySpending: number;
  averageDailySpending: number;
}
