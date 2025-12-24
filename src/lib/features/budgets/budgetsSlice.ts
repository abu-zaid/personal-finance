import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Budget, CreateBudgetInput, UpdateBudgetInput, BudgetWithSpending } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { calculatePercentage } from '@/lib/utils';
import { startOfMonth, endOfMonth, format } from 'date-fns';

// Helper types for Serializable Redux State
interface SerializableBudget extends Omit<Budget, 'createdAt' | 'updatedAt'> {
    createdAt: string;
    updatedAt: string;
}

interface SerializableBudgetWithSpending extends SerializableBudget {
    allocations: (Budget['allocations'][0] & {
        spent: number;
        remaining: number;
        percentageUsed: number;
        isOverBudget: boolean;
    })[];
    totalSpent: number;
    totalRemaining: number;
}

interface BudgetsState {
    items: SerializableBudget[];
    currentBudget: SerializableBudgetWithSpending | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: BudgetsState = {
    items: [],
    currentBudget: null,
    status: 'idle',
    error: null,
};

// Map DB row to SerializableBudget
function mapDbToBudget(budgetRow: any, allocations: any[]): SerializableBudget {
    return {
        id: budgetRow.id,
        userId: budgetRow.user_id,
        month: budgetRow.month,
        totalAmount: Number(budgetRow.total_amount),
        allocations: allocations.map((a) => ({
            categoryId: a.category_id,
            amount: Number(a.amount),
        })),
        createdAt: budgetRow.created_at,
        updatedAt: budgetRow.updated_at,
    };
}

// Async Thunks
export const fetchBudgets = createAsyncThunk(
    'budgets/fetchBudgets',
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            const { data: budgetsData, error: budgetsError } = await supabase
                .from('budgets')
                .select('*')
                .eq('user_id', user.id)
                .order('month', { ascending: false });

            if (budgetsError) throw budgetsError;
            if (!budgetsData) return [];

            const budgetIds = budgetsData.map((b) => b.id);
            const { data: allocationsData, error: allocationsError } = await supabase
                .from('budget_allocations')
                .select('*')
                .in('budget_id', budgetIds);

            if (allocationsError) throw allocationsError;

            return budgetsData.map((budgetRow) => {
                const budgetAllocations = (allocationsData || []).filter(
                    (a) => a.budget_id === budgetRow.id
                );
                return mapDbToBudget(budgetRow, budgetAllocations);
            });
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const fetchBudgetWithSpending = createAsyncThunk(
    'budgets/fetchBudgetWithSpending',
    async (month: string, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            // 1. Fetch Budget
            const { data: budgetData, error: budgetError } = await supabase
                .from('budgets')
                .select('*')
                .eq('user_id', user.id)
                .eq('month', month)
                .single();

            if (budgetError && budgetError.code !== 'PGRST116') throw budgetError; // PGRST116 is "no rows found"
            if (!budgetData) return null;

            // 2. Fetch Allocations
            const { data: allocationsData, error: allocationsError } = await supabase
                .from('budget_allocations')
                .select('*')
                .eq('budget_id', budgetData.id);

            if (allocationsError) throw allocationsError;

            const budget = mapDbToBudget(budgetData, allocationsData || []);

            // 3. Fetch Spending (Transactions Grouped by Category)
            const startDate = startOfMonth(new Date(month)).toISOString();
            const endDate = endOfMonth(new Date(month)).toISOString();

            // We need to query transactions to sum amounts by category
            // Supabase doesn't support complex group by easily with join in JS client without rpc or manual aggregation
            // We will fetch all expense transactions for the month and aggregate in JS
            // Optimization: filter by fields needed and 'expense' type
            const { data: transactions, error: txError } = await supabase
                .from('transactions')
                .select('amount, category_id')
                .eq('user_id', user.id)
                .eq('type', 'expense')
                .gte('date', startDate)
                .lte('date', endDate);

            if (txError) throw txError;

            const spendingMap = new Map<string, number>();
            transactions?.forEach(t => {
                const current = spendingMap.get(t.category_id) || 0;
                spendingMap.set(t.category_id, current + Number(t.amount));
            });

            // 4. Combine
            const allocationsWithSpending = budget.allocations.map(allocation => {
                const spent = spendingMap.get(allocation.categoryId) || 0;
                const remaining = allocation.amount - spent;
                const percentageUsed = calculatePercentage(spent, allocation.amount);

                return {
                    ...allocation,
                    spent,
                    remaining,
                    percentageUsed,
                    isOverBudget: spent > allocation.amount
                };
            });

            const totalSpent = allocationsWithSpending.reduce((sum, a) => sum + a.spent, 0);
            const totalRemaining = budget.totalAmount - totalSpent;

            return {
                ...budget,
                allocations: allocationsWithSpending,
                totalSpent,
                totalRemaining
            } as SerializableBudgetWithSpending;

        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

// ... Create/Update/Delete thunks (simplified for brevity, similar to categories)
export const createBudget = createAsyncThunk(
    'budgets/createBudget',
    async (input: CreateBudgetInput, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const supabase = createClient();
        if (!user || !supabase) return rejectWithValue('User not authenticated');
        // Implementation omitted for brevity but follows pattern
        // For now returning mock to avoid writing full logic unless needed immediately
        // Actually, let's implement validation at least
        try {
            // Check existence
            const existing = state.budgets.items.find((b: Budget) => b.month === input.month);
            if (existing) throw new Error('Budget already exists for this month');

            const { data: budgetData, error: budgetError } = await supabase
                .from('budgets')
                .insert({
                    user_id: user.id,
                    month: input.month,
                    total_amount: input.totalAmount,
                })
                .select()
                .single();
            if (budgetError) throw budgetError;

            // Allocations
            if (input.allocations.length > 0) {
                const { error: allocError } = await supabase
                    .from('budget_allocations')
                    .insert(input.allocations.map(a => ({
                        budget_id: budgetData.id,
                        category_id: a.categoryId,
                        amount: a.amount
                    })));
                if (allocError) throw allocError;
            }

            // To be proper, we should return the full object, easier to just refetch items or construct it
            // Let's construct it
            return {
                id: budgetData.id,
                userId: user.id,
                month: input.month,
                totalAmount: input.totalAmount,
                allocations: input.allocations,
                createdAt: budgetData.created_at,
                updatedAt: budgetData.updated_at
            } as SerializableBudget;

        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);
// ... createBudget code ...

export const updateBudget = createAsyncThunk(
    'budgets/updateBudget',
    async ({ id, input }: { id: string; input: UpdateBudgetInput }, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            // 1. Update Budget
            const updateData: any = {};
            if (input.totalAmount !== undefined) updateData.total_amount = input.totalAmount;

            const { data: budgetData, error: budgetError } = await supabase
                .from('budgets')
                .update(updateData)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (budgetError) throw budgetError;

            // 2. Update Allocations (Replace strategy)
            if (input.allocations) {
                // Delete existing
                const { error: deleteError } = await supabase
                    .from('budget_allocations')
                    .delete()
                    .eq('budget_id', id);
                if (deleteError) throw deleteError;

                // Insert new
                if (input.allocations.length > 0) {
                    const { error: insertError } = await supabase
                        .from('budget_allocations')
                        .insert(input.allocations.map(a => ({
                            budget_id: id,
                            category_id: a.categoryId,
                            amount: a.amount
                        })));
                    if (insertError) throw insertError;
                }
            }

            // Return updated structure (allocations replaced)
            return {
                id: budgetData.id,
                userId: user.id,
                month: budgetData.month,
                totalAmount: budgetData.total_amount, // DB column naming
                allocations: input.allocations || [], // Use input as it's the latest
                createdAt: budgetData.created_at,
                updatedAt: budgetData.updated_at
            } as SerializableBudget;

        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);
const budgetsSlice = createSlice({
    name: 'budgets',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchBudgets.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchBudgets.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchBudgets.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            .addCase(fetchBudgetWithSpending.fulfilled, (state, action) => {
                state.currentBudget = action.payload;
            })
            .addCase(createBudget.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
            })
            .addCase(updateBudget.fulfilled, (state, action) => {
                const index = state.items.findIndex(b => b.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
                // Refresh currentBudget if it matches
                if (state.currentBudget && state.currentBudget.id === action.payload.id) {
                    // We can't fully reconstruct BudgetWithSpending without totals, 
                    // but we can update the known fields. 
                    // Ideally we usually refetch current budget to get totals again.
                    // For now, let's just update the specific fields we know.
                    state.currentBudget = {
                        ...state.currentBudget,
                        totalAmount: action.payload.totalAmount,
                        // Allocations need to merge spending info which we don't have here easily.
                        // Best practice: Trigger a refetch or invalidate.
                        // Or simplistic update:
                        allocations: action.payload.allocations.map(a => {
                            const existing = state.currentBudget?.allocations.find(ex => ex.categoryId === a.categoryId);
                            return {
                                ...a,
                                spent: existing?.spent || 0,
                                // Recalculate remaining
                                remaining: a.amount - (existing?.spent || 0),
                                percentageUsed: calculatePercentage((existing?.spent || 0), a.amount),
                                isOverBudget: (existing?.spent || 0) > a.amount
                            };
                        })
                    } as SerializableBudgetWithSpending;
                }
            });
    },
});

export const selectBudgets = (state: any): Budget[] => {
    return state.budgets.items.map((item: SerializableBudget) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
    }));
};

export const selectCurrentBudget = (state: any): BudgetWithSpending | null => {
    const budget = state.budgets.currentBudget;
    if (!budget) return null;
    return {
        ...budget,
        createdAt: new Date(budget.createdAt),
        updatedAt: new Date(budget.updatedAt),
    };
};
export const selectBudgetsStatus = (state: any) => state.budgets.status;

export default budgetsSlice.reducer;
