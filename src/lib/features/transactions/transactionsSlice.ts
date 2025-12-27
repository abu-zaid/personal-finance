import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import {
    Transaction,
    TransactionWithCategory,
    TransactionFilters,
    CreateTransactionInput,
    UpdateTransactionInput,
    TransactionSort
} from '@/types';
import { createClient } from '@/lib/supabase/client';

import { toast } from 'sonner';

// ... (keep existing interfaces)



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

import { selectIsDemo } from '@/lib/features/auth/authSlice';
import { DEMO_TRANSACTIONS } from '@/lib/demo-data';

// ...

export const fetchTransactions = createAsyncThunk(
    'transactions/fetchTransactions',
    async ({ page = 0, append = false, pageSize = 20 }: { page?: number; append?: boolean; pageSize?: number }, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { filters } = state.transactions;
        const { user, isDemo } = state.auth;
        const supabase = createClient();

        if (isDemo) {
            // Mock Data Implementation
            let data = [...DEMO_TRANSACTIONS];

            // Apply basic filters (simplified for demo)
            if (filters.type && filters.type !== 'all') {
                data = data.filter(t => t.type === filters.type);
            }
            if (filters.search) {
                const search = filters.search.toLowerCase();
                data = data.filter(t => t.notes?.toLowerCase().includes(search));
            }

            const count = data.length;
            const PAGE_SIZE = pageSize;
            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE;
            const paginatedData = data.slice(from, to);

            // Transform to serializable
            const transactions: SerializableTransactionWithCategory[] = paginatedData.map((row: any) => ({
                id: row.id,
                userId: row.userId,
                amount: row.amount,
                type: row.type,
                categoryId: row.categoryId,
                date: row.date.toISOString(), // Ensure ISO string
                notes: row.notes,
                createdAt: row.createdAt.toISOString(),
                updatedAt: row.updatedAt.toISOString(),
                category: {
                    id: row.categoryId, // In demo data, we might want to lookup category details
                    name: 'Demo Category', // Placeholder or lookup
                    icon: 'more-horizontal',
                    color: '#6b7280'
                }
            }));

            // Better Category Lookup for Demo
            // We can import DEMO_CATEGORIES if we want better realism, but strict dependency might be annoying.
            // Let's simpler: just map categoryId to a color/name if possible or leave generic.
            // Actually, let's just leave generic for now or quick map.

            return { transactions, count, append };
        }

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        const PAGE_SIZE = pageSize;
        // ... existing Supabase logic
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
        const { user, isDemo } = state.auth;
        const supabase = createClient();

        if (isDemo) {
            let data = [...DEMO_TRANSACTIONS];
            // Apply Filters (Basic)
            if (filters.type && filters.type !== 'all') {
                data = data.filter(t => t.type === filters.type);
            }
            if (filters.search) {
                const search = filters.search.toLowerCase();
                data = data.filter(t => t.notes?.toLowerCase().includes(search));
            }
            // Date filters if present
            if (filters.startDate) {
                const start = new Date(filters.startDate);
                data = data.filter(t => t.date >= start);
            }
            if (filters.endDate) {
                const end = new Date(filters.endDate);
                end.setHours(23, 59, 59, 999);
                data = data.filter(t => t.date <= end);
            }

            const stats = data.reduce((acc: any, curr: any) => {
                const amount = Number(curr.amount);
                if (curr.type === 'income') acc.income += amount;
                else acc.expense += amount;
                return acc;
            }, { income: 0, expense: 0 });
            return stats;
        }

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
            const d = new Date(input.date);
            const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const localTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
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
    lastModified: number; // Timestamp for cache invalidation
    sortConfig: TransactionSort;
    transactionModal: {
        isOpen: boolean;
        editingTransaction: SerializableTransactionWithCategory | null;
    };
}

const initialState: TransactionsState = {
    items: [],
    totalCount: 0,
    status: 'idle',
    error: null,
    hasMore: true,
    filters: initialFilters,
    sortConfig: { field: 'date', order: 'desc' },
    aggregates: {
        monthlyExpenses: {},
        monthlyIncome: {},
        categoryTotals: {},
        dailyStats: {},
    },
    filteredStats: { income: 0, expense: 0 },
    lastModified: 0,
    transactionModal: {
        isOpen: false,
        editingTransaction: null,
    },
};

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
                const d = new Date(input.date);
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
        const { user, isDemo } = state.auth;

        if (isDemo) {
            // Calculate from DEMO_TRANSACTIONS
            const total = DEMO_TRANSACTIONS
                .filter(t => t.type === type && t.date.toISOString().startsWith(month))
                .reduce((sum, t) => sum + Number(t.amount), 0);
            return { month, type, total };
        }

        const supabase = createClient();

        if (!user || !supabase) throw new Error('User not authenticated');

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
        const { user, isDemo } = state.auth;

        if (isDemo) {
            const [year, monthNum] = month.split('-').map(Number);
            const targetMonthStr = `${year}-${String(monthNum).padStart(2, '0')}`;

            const data = DEMO_TRANSACTIONS.filter(t => {
                // Convert to YYYY-MM
                const tDate = t.date;
                const tMonthStr = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
                return t.type === 'expense' && tMonthStr === targetMonthStr;
            });

            // Aggregate
            const dayMap = new Map<string, {
                amount: number;
                count: number;
                cats: Map<string, CategoryBreakdownItem>
            }>();

            // Needs category info. In demo, we might not have full category object joined.
            // But we can infer from DEMO_CATEGORIES if we import it, or just use placeholders.
            // Let's verify if DEMO_CATEGORIES is available. 
            // We can check categoriesSlice state actually!
            const categories = state.categories.items;

            data.forEach(t => {
                const dayStr = t.date.toISOString().split('T')[0];
                const existing = dayMap.get(dayStr) || { amount: 0, count: 0, cats: new Map() };
                existing.amount += Number(t.amount);
                existing.count += 1;

                // Find category
                const cat = categories.find((c: any) => c.id === t.categoryId);
                const catId = t.categoryId;

                const existingCat = existing.cats.get(catId) || {
                    id: catId,
                    name: cat?.name || 'Unknown',
                    icon: cat?.icon || 'circle',
                    color: cat?.color || '#ccc',
                    value: 0
                };
                existingCat.value += Number(t.amount);
                existing.cats.set(catId, existingCat);

                dayMap.set(dayStr, existing);
            });

            const stats: DailyStat[] = Array.from(dayMap.entries()).map(([date, val]) => {
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
        }

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

export const fetchTransactionsForExport = createAsyncThunk(
    'transactions/fetchForExport',
    async ({ startMonth, endMonth }: { startMonth: string; endMonth: string }, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        const startDate = new Date(`${startMonth}-01`);
        const nextMonthDate = new Date(`${endMonth}-01`);
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        const endDateIso = nextMonthDate.toISOString();

        try {
            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    categories:category_id (
                        id, name, icon, color
                    )
                `)
                .eq('user_id', user.id)
                .gte('date', startDate.toISOString())
                .lt('date', endDateIso)
                .order('date', { ascending: false })
                .limit(1000);

            if (error) throw error;

            const transactions: SerializableTransactionWithCategory[] = (data || []).map((row: any) => ({
                ...mapDbToTransaction(row),
                category: row.categories || {
                    id: row.category_id,
                    name: 'Unknown',
                    icon: 'more-horizontal',
                    color: '#6b7280',
                },
            }));

            return transactions;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

// ... existing slice ...
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
        setSortConfig: (state, action: PayloadAction<TransactionSort>) => {
            state.sortConfig = action.payload;
        },
        openTransactionModal: (state, action: PayloadAction<SerializableTransactionWithCategory | undefined>) => {
            state.transactionModal.isOpen = true;
            state.transactionModal.editingTransaction = action.payload || null;
        },
        closeTransactionModal: (state) => {
            state.transactionModal.isOpen = false;
            state.transactionModal.editingTransaction = null;
        },
        setTransactions: (state, action: PayloadAction<any[]>) => {
            // Simple replacement for hydration
            state.items = action.payload.map(t => ({
                id: t.id,
                userId: t.userId,
                amount: t.amount,
                type: t.type,
                categoryId: t.categoryId,
                date: t.date?.toString() || new Date().toISOString(),
                notes: t.notes,
                createdAt: t.createdAt?.toString() || new Date().toISOString(),
                updatedAt: t.updatedAt?.toString() || new Date().toISOString(),
            }));
            state.status = 'succeeded';
        },
        resetTransactions: (state) => {
            return initialState;
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
                // Invalidate aggregates
                state.lastModified = Date.now();
                state.aggregates.monthlyExpenses = {};
                state.aggregates.monthlyIncome = {};
                state.aggregates.dailyStats = {};
            })

            // Update
            .addCase(updateTransaction.fulfilled, (state, action) => {
                const index = state.items.findIndex(t => t.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
                // Invalidate aggregates
                state.lastModified = Date.now();
                state.aggregates.monthlyExpenses = {};
                state.aggregates.monthlyIncome = {};
                state.aggregates.dailyStats = {};
            })

            // Delete
            .addCase(deleteTransaction.fulfilled, (state, action) => {
                state.items = state.items.filter(t => t.id !== action.payload);
                state.totalCount -= 1;
                // Invalidate aggregates
                state.lastModified = Date.now();
                state.aggregates.monthlyExpenses = {};
                state.aggregates.monthlyIncome = {};
                state.aggregates.dailyStats = {};
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

    },
});

// Actions
export const {
    setFilters,
    clearFilters,
    setSortConfig,
    setTransactions,
    resetTransactions,
    openTransactionModal,
    closeTransactionModal
} = transactionsSlice.actions;

// Selectors
export const selectTransactions = (state: any) => state.transactions.items;
export const selectTransactionStatus = (state: any) => state.transactions.status;
export const selectTransactionError = (state: any) => state.transactions.error;
export const selectTransactionStats = (state: any) => state.transactions.filteredStats;
export const selectTransactionFilters = (state: any) => state.transactions.filters; // Kept this as it was not explicitly removed by the instruction's provided code.

// Pagination selectors
export const selectTransactionCount = (state: any) => state.transactions.totalCount;
export const selectHasMoreTransactions = (state: any) => state.transactions.hasMore;
export const selectTransactionAggregates = (state: any) => state.transactions.aggregates;
// These were missing or named differently, adding alias for compatibility with existing code
export const selectMonthlyAggregates = (state: any) => state.transactions.aggregates;
export const selectDailyStats = (state: any) => state.transactions.aggregates.dailyStats;

// Modal selectors
export const selectTransactionModal = (state: any) => state.transactions.transactionModal;

// Memoized selectors for better performance

// Selector for monthly expense for a specific month
export const selectMonthlyExpenseForMonth = (month: string) =>
    createSelector(
        [selectMonthlyAggregates],
        (aggregates) => aggregates.monthlyExpenses[month] || 0
    );

// Selector for monthly income for a specific month
export const selectMonthlyIncomeForMonth = (month: string) =>
    createSelector(
        [selectMonthlyAggregates],
        (aggregates) => aggregates.monthlyIncome[month] || 0
    );

// Selector for daily stats for a specific month
export const selectDailyStatsForMonth = (month: string) =>
    createSelector(
        [selectDailyStats],
        (dailyStats) => dailyStats[month] || []
    );

export default transactionsSlice.reducer;
