import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
    Transaction,
    TransactionWithCategory,
    TransactionFilters,
    CreateTransactionInput,
    UpdateTransactionInput
} from '@/types';
import { createClient } from '@/lib/supabase/client';
import { fetchBudgetWithSpending } from '@/lib/features/budgets/budgetsSlice';
import { toast } from 'sonner';

// Helper to define Serializable Transaction for Redux
interface SerializableTransaction extends Omit<Transaction, 'date' | 'createdAt' | 'updatedAt'> {
    date: string;
    createdAt: string;
    updatedAt: string;
}

interface SerializableTransactionWithCategory extends Omit<SerializableTransaction, 'categoryId'> {
    categoryId: string; // Already string
    category?: {
        id: string;
        name: string;
        icon: string;
        color: string;
    };
}

export interface CategoryBreakdownItem {
    id: string;
    name: string;
    icon: string;
    color: string;
    value: number;
}

export interface DailyStat {
    date: string;
    amount: number;
    count: number;
    topCategory: string;
    breakdown: CategoryBreakdownItem[];
}

// Type definitions

// Helper: Map DB row to SerializableTransaction
function mapDbToTransaction(row: any): SerializableTransaction {
    return {
        id: row.id,
        userId: row.user_id,
        amount: Number(row.amount),
        type: (row.type as 'expense' | 'income') || 'expense',
        categoryId: row.category_id,
        date: row.date,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// Helper: Apply filters to Supabase query
const applyQueryFilters = (query: any, filters: any) => {
    if (filters.startDate) {
        query = query.gte('date', new Date(filters.startDate).toISOString());
    }
    if (filters.endDate) {
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('date', endOfDay.toISOString());
    }
    if (filters.categoryIds && filters.categoryIds.length > 0) {
        query = query.in('category_id', filters.categoryIds);
    }
    if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
    }
    if (filters.minAmount !== undefined) {
        query = query.gte('amount', filters.minAmount);
    }
    if (filters.maxAmount !== undefined) {
        query = query.lte('amount', filters.maxAmount);
    }
    if (filters.search) {
        query = query.ilike('notes', `%${filters.search}%`);
    }
    return query;
};

// Async Thunks

export const fetchTransactions = createAsyncThunk(
    'transactions/fetchTransactions',
    async ({ page = 0, append = false, pageSize = 20 }: { page?: number; append?: boolean; pageSize?: number }, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { filters } = state.transactions;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        const PAGE_SIZE = pageSize;
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        try {
            let query = supabase
                .from('transactions')
                .select(`
          *,
          categories:category_id (
            id, name, icon, color
          )
        `, { count: 'exact' })
                .eq('user_id', user.id);

            query = applyQueryFilters(query, filters);

            const { data, error, count } = await query
                .order('date', { ascending: false })
                .range(from, to);

            if (error) throw error;

            // Transform data to include category
            const transactions: SerializableTransactionWithCategory[] = (data || []).map((row: any) => ({
                ...mapDbToTransaction(row),
                category: row.categories || {
                    id: row.category_id,
                    name: 'Unknown',
                    icon: 'more-horizontal',
                    color: '#6b7280',
                },
            }));

            return { transactions, count, append };
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const fetchFilteredStats = createAsyncThunk(
    'transactions/fetchFilteredStats',
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { filters } = state.transactions;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            // Fetch minimal data for aggregation
            let query = supabase
                .from('transactions')
                .select('amount, type')
                .eq('user_id', user.id);

            query = applyQueryFilters(query, filters);

            const { data, error } = await query;

            if (error) throw error;

            const stats = (data || []).reduce((acc: any, curr: any) => {
                const amount = Number(curr.amount);
                if (curr.type === 'income') acc.income += amount;
                else acc.expense += amount;
                return acc;
            }, { income: 0, expense: 0 });

            return stats;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const createTransaction = createAsyncThunk(
    'transactions/createTransaction',
    async (input: CreateTransactionInput, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            // Use local date format to avoid timezone issues
            const localDate = `${input.date.getFullYear()}-${String(input.date.getMonth() + 1).padStart(2, '0')}-${String(input.date.getDate()).padStart(2, '0')}`;
            const localTime = `${String(input.date.getHours()).padStart(2, '0')}:${String(input.date.getMinutes()).padStart(2, '0')}:00`;
            const dateTimeString = `${localDate}T${localTime}`;

            const { data, error } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    amount: input.amount,
                    type: input.type,
                    category_id: input.categoryId,
                    date: dateTimeString,
                    notes: input.notes || null,
                })
                .select(`
          *,
          categories:category_id (
            id, name, icon, color
          )
        `)
                .single();

            if (error) throw error;

            return {
                ...mapDbToTransaction(data),
                category: data.categories,
            } as SerializableTransactionWithCategory;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

const initialFilters: TransactionsState['filters'] = {
    startDate: undefined,
    endDate: undefined,
};

// Update State Interface
interface TransactionsState {
    items: SerializableTransactionWithCategory[];
    totalCount: number;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    hasMore: boolean;
    filters: Omit<TransactionFilters, 'startDate' | 'endDate'> & { startDate?: string; endDate?: string };
    aggregates: {
        monthlyExpenses: Record<string, number>;
        monthlyIncome: Record<string, number>;
        categoryTotals: Record<string, number>;
        dailyStats: Record<string, DailyStat[]>;
    };
    filteredStats: {
        income: number;
        expense: number;
    };
}

const initialState: TransactionsState = {
    items: [],
    totalCount: 0,
    status: 'idle',
    error: null,
    hasMore: true,
    filters: initialFilters,
    aggregates: {
        monthlyExpenses: {},
        monthlyIncome: {},
        categoryTotals: {},
        dailyStats: {},
    },
    filteredStats: { income: 0, expense: 0 },
};

// ... (Rest of the file)


export const updateTransaction = createAsyncThunk(
    'transactions/updateTransaction',
    async ({ id, input }: { id: string; input: UpdateTransactionInput }, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            const updateData: Record<string, unknown> = {};
            if (input.amount !== undefined) updateData.amount = input.amount;
            if (input.type !== undefined) updateData.type = input.type;
            if (input.categoryId !== undefined) updateData.category_id = input.categoryId;
            if (input.date !== undefined) {
                const d = input.date;
                const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const localTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
                updateData.date = `${localDate}T${localTime}`;
            }
            if (input.notes !== undefined) updateData.notes = input.notes || null;

            const { data, error } = await supabase
                .from('transactions')
                .update(updateData)
                .eq('id', id)
                .eq('user_id', user.id)
                .select(`
          *,
          categories:category_id (
            id, name, icon, color
          )
        `)
                .single();

            if (error) throw error;

            return {
                ...mapDbToTransaction(data),
                category: data.categories,
            } as SerializableTransactionWithCategory;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const deleteTransaction = createAsyncThunk(
    'transactions/deleteTransaction',
    async (id: string, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
            return id;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const fetchMonthlyAggregates = createAsyncThunk(
    'transactions/fetchAggregates',
    async ({ month, type }: { month: string; type: 'expense' | 'income' }, { getState }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) throw new Error('User not authenticated');

        // Calculate next month for range
        const [year, monthNum] = month.split('-').map(Number);
        const nextDate = new Date(year, monthNum, 1);
        const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

        const { data } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('type', type)
            .gte('date', `${month}-01`)
            .lt('date', `${nextMonth}-01`);

        const total = (data || []).reduce((sum, t) => sum + Number(t.amount), 0);
        return { month, type, total };
    },
    {
        condition: ({ month, type }, { getState }) => {
            const state = getState() as any;
            const aggregates = state.transactions.aggregates;
            // Don't fetch if we already have the data
            if (type === 'expense' && aggregates.monthlyExpenses[month] !== undefined) return false;
            if (type === 'income' && aggregates.monthlyIncome[month] !== undefined) return false;
            return true;
        }
    }
);

export const fetchDailyTransactionStats = createAsyncThunk(
    'transactions/fetchDailyStats',
    async (month: string, { getState }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) throw new Error('User not authenticated');

        // Calculate next month for range
        const [year, monthNum] = month.split('-').map(Number);
        const nextDate = new Date(year, monthNum, 1);
        const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

        // Fetch all expenses for the month to aggregate
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                amount,
                date,
                categories:category_id (id, name, icon, color)
            `)
            .eq('user_id', user.id)
            .eq('type', 'expense')
            .gte('date', `${month}-01`)
            .lt('date', `${nextMonth}-01`);

        if (error) throw error;

        // Aggregate by day
        const dayMap = new Map<string, {
            amount: number;
            count: number;
            cats: Map<string, CategoryBreakdownItem>
        }>();

        data?.forEach((t: any) => {
            // Local date string YYYY-MM-DD
            const dayStr = new Date(t.date).toISOString().split('T')[0];

            const existing = dayMap.get(dayStr) || { amount: 0, count: 0, cats: new Map() };
            existing.amount += Number(t.amount);
            existing.count += 1;

            const cat = t.categories;
            if (cat) {
                const catId = cat.id;
                const existingCat = existing.cats.get(catId) || {
                    id: catId,
                    name: cat.name,
                    icon: cat.icon,
                    color: cat.color,
                    value: 0
                };
                existingCat.value += Number(t.amount);
                existing.cats.set(catId, existingCat);
            }

            dayMap.set(dayStr, existing);
        });

        const stats: DailyStat[] = Array.from(dayMap.entries()).map(([date, val]) => {
            // Find top category
            let topCat = '';
            let maxVal = 0;

            const breakdown: CategoryBreakdownItem[] = Array.from(val.cats.values());

            breakdown.forEach((item) => {
                if (item.value > maxVal) {
                    maxVal = item.value;
                    topCat = item.name;
                }
            });

            return {
                date,
                amount: val.amount,
                count: val.count,
                topCategory: topCat,
                breakdown
            };
        });

        return { month, stats };
    },
    {
        condition: (month, { getState }) => {
            const state = getState() as any;
            // Avoid refetch if we have data for this month already
            if (state.transactions.aggregates.dailyStats[month]) return false;
            return true;
        }
    }
);

// Slice
const transactionsSlice = createSlice({
    name: 'transactions',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Omit<TransactionFilters, 'startDate' | 'endDate'> & { startDate?: string; endDate?: string }>) => {
            state.filters = action.payload;
        },
        clearFilters: (state) => {
            state.filters = initialFilters;
        },
        // Optimistic helpers could be added here if not using Thunks full lifecycle
    },
    extraReducers: (builder) => {
        builder
            // Fetch Transactions
            .addCase(fetchTransactions.pending, (state, action) => {
                if (!action.meta.arg.append) {
                    state.status = 'loading';
                }
            })
            .addCase(fetchTransactions.fulfilled, (state, action) => {
                state.status = 'succeeded';
                if (action.payload.append) {
                    state.items = [...state.items, ...action.payload.transactions];
                } else {
                    state.items = action.payload.transactions;
                }
                if (action.payload.count !== null) {
                    state.totalCount = action.payload.count || 0;
                }
                // Check against the requested page size
                const requestedSize = action.meta.arg.pageSize || 20;
                state.hasMore = action.payload.transactions.length === requestedSize;
            })
            .addCase(fetchTransactions.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })

            // Filtered Stats
            .addCase(fetchFilteredStats.fulfilled, (state, action) => {
                state.filteredStats = action.payload;
            })

            // Create
            .addCase(createTransaction.fulfilled, (state, action) => {
                state.items = [action.payload, ...state.items];
                state.totalCount += 1;
                // Invalidate aggregates potentially?
            })

            // Update
            .addCase(updateTransaction.fulfilled, (state, action) => {
                const index = state.items.findIndex(t => t.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })

            // Delete
            .addCase(deleteTransaction.fulfilled, (state, action) => {
                state.items = state.items.filter(t => t.id !== action.payload);
                state.totalCount -= 1;
            })

            // Aggregates
            .addCase(fetchMonthlyAggregates.fulfilled, (state, action) => {
                const { month, type, total } = action.payload;
                if (type === 'expense') {
                    state.aggregates.monthlyExpenses[month] = total;
                } else {
                    state.aggregates.monthlyIncome[month] = total;
                }
            })
            // Daily Stats
            .addCase(fetchDailyTransactionStats.fulfilled, (state, action) => {
                const { month, stats } = action.payload;
                state.aggregates.dailyStats[month] = stats;
            })
            // Sync from Budget Fetch
            .addCase(fetchBudgetWithSpending.fulfilled, (state, action) => {
                if (action.payload) {
                    const { month, totalSpent } = action.payload;
                    // Budget fetch always gets expenses
                    state.aggregates.monthlyExpenses[month] = totalSpent;
                }
            });
    },
});

export const { setFilters, clearFilters } = transactionsSlice.actions;

// Selectors
export const selectTransactions = (state: any): TransactionWithCategory[] => {
    return state.transactions.items.map((item: SerializableTransactionWithCategory) => ({
        ...item,
        date: new Date(item.date),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
    }));
};
export const selectTransactionsStatus = (state: any) => state.transactions.status;
export const selectTransactionsError = (state: any) => state.transactions.error;
export const selectMonthlyAggregates = (state: any) => state.transactions.aggregates;
export const selectDailyStats = (state: any) => state.transactions.aggregates.dailyStats;
export const selectFilteredStats = (state: any) => state.transactions.filteredStats;

export default transactionsSlice.reducer;
