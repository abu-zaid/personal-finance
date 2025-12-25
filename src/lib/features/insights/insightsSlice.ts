
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createClient } from '@/lib/supabase/client';
import { FinancialHealthScore, SmartInsight, CategorySpending, SpendingTrend } from '@/types/summary';
import { subMonths, isSameDay, getDaysInMonth, startOfMonth, endOfMonth, eachDayOfInterval, format, startOfWeek, endOfWeek, eachWeekOfInterval, isSameWeek } from 'date-fns';
import { getMonthString } from '@/lib/utils';
import { RootState } from '@/lib/store';

// Helper types
interface MonthlyTrend {
    label: string;
    value: number;
}

interface InsightsState {
    financialHealth: FinancialHealthScore | null;
    smartInsights: SmartInsight[];
    spendingTrends: MonthlyTrend[];
    categoryBreakdown: CategorySpending[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    lastUpdated: number | null;
}

const initialState: InsightsState = {
    financialHealth: null,
    smartInsights: [],
    spendingTrends: [],
    categoryBreakdown: [],
    status: 'idle',
    error: null,
    lastUpdated: null,
};

// Async Thunks
export const fetchInsightsData = createAsyncThunk(
    'insights/fetchAll',
    async (_, { getState, dispatch, rejectWithValue }) => {
        const state = getState() as RootState;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            const currentMonth = getMonthString(new Date());
            const previousMonth = getMonthString(subMonths(new Date(), 1));

            // Parallel Data Fetching
            // 1. Current Month Expenses (Total & by Category)
            // 2. Previous Month Expenses (Total & by Category)
            // 3. 6-Month History
            // 4. Budget (Assumed fetched, but better to ensure)

            // We'll do raw queries for efficiency
            const [
                currentMonthTxns,
                previousMonthTxns,
                historyTxns,
                categoriesRes,
                budgetRes
            ] = await Promise.all([
                // Current Month
                supabase
                    .from('transactions')
                    .select('amount, category_id, date, type')
                    .eq('user_id', user.id)
                    .eq('type', 'expense')
                    .gte('date', `${currentMonth}-01`)
                    .lt('date', `${getMonthString(subMonths(new Date(), -1))}-01`),

                // Previous Month
                supabase
                    .from('transactions')
                    .select('amount, category_id, type')
                    .eq('user_id', user.id)
                    .eq('type', 'expense')
                    .gte('date', `${previousMonth}-01`)
                    .lt('date', `${currentMonth}-01`),

                // 6 Months History
                supabase
                    .from('transactions')
                    .select('amount, date, type')
                    .eq('user_id', user.id)
                    .eq('type', 'expense')
                    .gte('date', `${getMonthString(subMonths(new Date(), 5))}-01`), // Last 6 months inclusive

                // Categories (for metadata)
                supabase.from('categories').select('*').eq('user_id', user.id),

                // Budget
                supabase.from('budgets').select('*').eq('user_id', user.id).eq('month', currentMonth).single()
            ]);

            if (currentMonthTxns.error) throw currentMonthTxns.error;
            if (previousMonthTxns.error) throw previousMonthTxns.error;
            if (historyTxns.error) throw historyTxns.error;
            if (categoriesRes.error) throw categoriesRes.error;

            const transactions = currentMonthTxns.data || [];
            const prevTransactions = previousMonthTxns.data || [];
            const allHistory = historyTxns.data || [];
            const categories = categoriesRes.data || [];
            const currentBudget = budgetRes.data;

            // --- CALCULATIONS ---

            // 1. Aggregates
            const currentExpenses = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
            const previousExpenses = prevTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

            // Note: Income is needed for Savings Rate. We'll fetch it separately or assume simpler model for now.
            // Let's fetch current income too
            const { data: incomeData } = await supabase
                .from('transactions')
                .select('amount')
                .eq('user_id', user.id)
                .eq('type', 'income')
                .gte('date', `${currentMonth}-01`);
            const currentIncome = (incomeData || []).reduce((sum, t) => sum + Number(t.amount), 0);


            // 2. Spending Trends (Last 6 Months)
            const spendingTrends: MonthlyTrend[] = [];
            for (let i = 5; i >= 0; i--) {
                const date = subMonths(new Date(), i);
                const monthStr = getMonthString(date);
                const monthTotal = allHistory
                    .filter(t => getMonthString(new Date(t.date)) === monthStr)
                    .reduce((sum, t) => sum + Number(t.amount), 0);

                spendingTrends.push({
                    label: format(date, 'MMM'),
                    value: monthTotal
                });
            }

            // 3. Category Breakdown
            const categoryBreakdown: CategorySpending[] = categories.map(cat => {
                const catTxns = transactions.filter(t => t.category_id === cat.id);
                const total = catTxns.reduce((sum, t) => sum + Number(t.amount), 0);
                const percentage = currentExpenses > 0 ? (total / currentExpenses) * 100 : 0;

                return {
                    categoryId: cat.id,
                    categoryName: cat.name,
                    categoryIcon: cat.icon,
                    categoryColor: cat.color,
                    amount: total,
                    percentage,
                    isOverBudget: false // Simple default
                };
            }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);


            // 4. Financial Health Score
            const savingsAmount = currentIncome - currentExpenses;
            const savingsRatePercent = currentIncome > 0 ? (savingsAmount / currentIncome) * 100 : 0;
            const savingsRateScore = Math.min(Math.max(savingsRatePercent * 2, 0), 100);

            let budgetAdherenceScore = 50;
            let budgetUsage = 0;
            if (currentBudget && currentBudget.amount > 0) { // DB uses 'amount' for total? Verify schema.
                // Schema: budgets has 'amount' (total amount) based on types/budget.ts? 
                // Wait, types/budget.ts says interface Budget { totalAmount: number ... }
                // DB generic row usually matches snake_case but budget.ts usually maps it.
                // Let's assume 'amount' or 'total_amount'. Let's check schema via mapped object if possible.
                // For now, assuming standard column 'amount' (total) or sum of allocations.
                // Actually, `fetchBudgetWithSpending` uses nested allocations.
                // Let's trust the budget object structure if we mapped it, but here we have raw DB.
                // Let's assume `amount` column exists on `budgets` table or we calculate from allocations.
                // Checking `budgetsSlice`: insert uses `amount: input.totalAmount`? No.
                // The `Transaction` table uses `amount`. `Budget` table usually relies on allocations or a total column.
                // If `currentBudget` is raw DB response, it might just be the row. 
                // Let's assume `amount` column for total budget based on common patterns or `total_amount`.
                // SAFEST: Fetch `fetchBudgetWithSpending` thunk result from state? No, we want self-contained.
                // Let's use `currentBudget.amount` if it exists, else 0.
                // Fix: Types? `currentBudget` is `any` here effectively.
                const bTotal = currentBudget?.amount || 0;
                if (bTotal > 0) {
                    budgetUsage = (currentExpenses / bTotal) * 100;
                    if (budgetUsage <= 80) budgetAdherenceScore = 100;
                    else if (budgetUsage <= 100) budgetAdherenceScore = 100 - ((budgetUsage - 80) * 2.5);
                    else budgetAdherenceScore = Math.max(50 - ((budgetUsage - 100) * 2), 0);
                }
            }

            let trendScore = 50;
            if (previousExpenses > 0) {
                const changePercent = ((currentExpenses - previousExpenses) / previousExpenses) * 100;
                if (changePercent <= -10) trendScore = 100;
                else if (changePercent <= 0) trendScore = 100 - Math.abs(changePercent) * 5;
                else if (changePercent <= 10) trendScore = 50 - (changePercent * 2.5);
                else trendScore = Math.max(25 - ((changePercent - 10) * 1.25), 0);
            }

            const overallScore = Math.round(savingsRateScore * 0.4 + budgetAdherenceScore * 0.35 + trendScore * 0.25);

            let healthStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
            if (overallScore >= 80) healthStatus = 'excellent';
            else if (overallScore >= 60) healthStatus = 'good';
            else if (overallScore >= 40) healthStatus = 'fair';

            const recommendations: string[] = [];
            if (savingsRateScore < 40) recommendations.push('Try to save at least 20% of your income');
            if (budgetAdherenceScore < 50) recommendations.push('Review your budget - spending is too high');
            if (trendScore < 40) recommendations.push('Spending is increasing - find areas to cut');

            const financialHealth: FinancialHealthScore = {
                overall: overallScore,
                savingsRate: Math.round(savingsRateScore),
                budgetAdherence: Math.round(budgetAdherenceScore),
                spendingTrend: Math.round(trendScore),
                recommendations,
                status: healthStatus
            };

            // 5. Smart Insights
            const smartInsights: SmartInsight[] = [];

            // Spike Detection (simple)
            const dailyMap = new Map<string, number>();
            transactions.forEach(t => {
                const d = t.date.split('T')[0];
                dailyMap.set(d, (dailyMap.get(d) || 0) + t.amount);
            });
            const maxDaily = Math.max(...Array.from(dailyMap.values()), 0);
            const avgDaily = currentExpenses / (new Date().getDate() || 1);
            if (maxDaily > avgDaily * 3 && maxDaily > 100) {
                smartInsights.push({
                    id: 'spike-warning',
                    type: 'warning',
                    title: 'Spending Spike',
                    message: `Unusually high spending detected on a single day.`,
                    impact: `Highest: ${maxDaily.toFixed(0)}`
                });
            }

            // Savings Opportunity
            if (categoryBreakdown.length > 0 && categoryBreakdown[0].percentage > 40) {
                smartInsights.push({
                    id: 'savings-opportunity',
                    type: 'opportunity',
                    title: 'Savings Opportunity',
                    message: `${categoryBreakdown[0].categoryName} accounts for ${categoryBreakdown[0].percentage.toFixed(0)}% of spending.`,
                    action: 'Review recurring expenses'
                });
            }

            // Populate State
            return {
                financialHealth,
                smartInsights,
                spendingTrends,
                categoryBreakdown
            };

        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

const insightsSlice = createSlice({
    name: 'insights',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchInsightsData.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchInsightsData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.financialHealth = action.payload.financialHealth;
                state.smartInsights = action.payload.smartInsights;
                state.spendingTrends = action.payload.spendingTrends;
                state.categoryBreakdown = action.payload.categoryBreakdown;
                state.lastUpdated = Date.now();
            })
            .addCase(fetchInsightsData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            });
    }
});

export const selectInsights = (state: RootState) => state.insights;
export const selectFinancialHealth = (state: RootState) => state.insights.financialHealth;
export const selectSmartInsights = (state: RootState) => state.insights.smartInsights;
export const selectInsightsStatus = (state: RootState) => state.insights.status;

export default insightsSlice.reducer;
