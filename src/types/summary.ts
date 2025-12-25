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
  prevAmount?: number;
  change?: number; // % change vs previous month
  count?: number;
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

export interface FinancialHealthScore {
  overall: number;
  savingsRate: number;
  budgetAdherence: number;
  spendingTrend: number;
  recommendations: string[];
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface SmartInsight {
  type: 'opportunity' | 'warning' | 'achievement' | 'tip';
  title: string;
  message: string;
  action?: string;
  impact?: string;
}
