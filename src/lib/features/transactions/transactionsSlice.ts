import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
    Transaction,
    TransactionWithCategory,
    TransactionFilters,
    CreateTransactionInput,
    UpdateTransactionInput,
    TransactionSort
} from '@/types';
import { createClient } from '@/lib/supabase/client';
// import { RootState } from '@/lib/store';
import { getMonthString } from '@/lib/utils';
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

// Type definitions
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
        categoryTotals: Record<string, number>; // key: `${categoryId}-${month || 'all'}`
    };
}

const initialFilters: TransactionsState['filters'] = {
    startDate: undefined,
    endDate: undefined,
};

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
    },
};

// Helper: Map DB row to SerializableTransaction
function mapDbToTransaction(row: any): SerializableTransaction {
    return {
        id: row.id,
        userId: row.user_id,
        amount: Number(row.amount),
        type: (row.type as 'expense' | 'income') || 'expense',
        categoryId: row.category_id,
        date: row.date, // Keep as string or ISO string from DB
        notes: row.notes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// Async Thunks

export const fetchTransactions = createAsyncThunk(
    'transactions/fetchTransactions',
    async ({ page = 0, append = false }: { page?: number; append?: boolean }, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { filters } = state.transactions;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        const PAGE_SIZE = 20;
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
        `)
                .eq('user_id', user.id);

            // Apply Filters
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
                state.hasMore = action.payload.transactions.length === 20; // Page size
            })
            .addCase(fetchTransactions.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
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

export default transactionsSlice.reducer;
