import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RecurringTransaction, CreateRecurringInput, UpdateRecurringInput } from '@/types';
import { DEMO_RECURRING } from '@/lib/demo-data';
import { createClient } from '@/lib/supabase/client';

// Helper to define Serializable Recurring Transaction for Redux
interface SerializableRecurringTransaction extends Omit<RecurringTransaction, 'created_at' | 'updated_at' | 'category'> {
    created_at: string;
    updated_at: string;
    category?: {
        id: string;
        userId: string;
        name: string;
        icon: string;
        color: string;
        isDefault: boolean;
        order: number;
        createdAt: string; // ISO string
        updatedAt: string; // ISO string
    };
}

interface RecurringState {
    items: SerializableRecurringTransaction[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: RecurringState = {
    items: [],
    status: 'idle',
    error: null,
};

// Map DB row to SerializableRecurringTransaction
// Note: We expect 'categories' join to be populated if possible, or we might need to handle it.
// The context fetched '*, category:categories(*)'
function mapDbToRecurring(row: any): SerializableRecurringTransaction {
    return {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        amount: Number(row.amount),
        type: row.type || 'expense', // Default to expense for safety
        frequency: row.frequency,
        status: row.status,
        category_id: row.category_id,
        next_date: row.next_date,
        created_at: row.created_at,
        updated_at: row.updated_at,
        category: row.category ? {
            id: row.category.id,
            userId: row.category.user_id,
            name: row.category.name,
            icon: row.category.icon,
            color: row.category.color,
            isDefault: row.category.is_default,
            order: row.category.sort_order, // Ensure Category type match
            createdAt: row.category.created_at,
            updatedAt: row.category.updated_at,
        } : undefined
    };
}

// ...

// Async Thunks
export const checkRecurringTransactions = createAsyncThunk(
    'recurring/checkRecurring',
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            const { data, error } = await supabase.rpc('process_recurring_transactions', {
                p_user_id: user.id
            });

            if (error) throw error;
            return data;
        } catch (err: any) {
            // We usually don't want to block the app for this background task
            return rejectWithValue(err.message);
        }
    }
);

export const fetchRecurring = createAsyncThunk(
    'recurring/fetchRecurring',
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user, isDemo } = state.auth;
        const supabase = createClient();

        if (isDemo) {
            return DEMO_RECURRING.map(r => ({
                id: r.id,
                user_id: r.user_id,
                name: r.name,
                amount: r.amount,
                type: (r as any).type || 'expense',
                frequency: r.frequency,
                status: r.status,
                category_id: r.category_id,
                next_date: r.next_date,
                created_at: r.created_at,
                updated_at: r.updated_at,
                category: undefined // In demo, we might skip category detail for simplicity or join manually from DEMO_CATEGORIES
            }));
        }

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            const { data, error } = await supabase
                .from('recurring_transactions')
                .select('*, category:categories(*)')
                .eq('user_id', user.id)
                .order('next_date', { ascending: true });

            if (error) throw error;
            return (data || []).map(mapDbToRecurring);
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const createRecurring = createAsyncThunk(
    'recurring/createRecurring',
    async (input: CreateRecurringInput, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            const { data, error } = await supabase
                .from('recurring_transactions')
                .insert({
                    user_id: user.id,
                    ...input,
                })
                .select('*, category:categories(*)')
                .single();

            if (error) throw error;
            return mapDbToRecurring(data);
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const updateRecurring = createAsyncThunk(
    'recurring/updateRecurring',
    async ({ id, input }: { id: string; input: UpdateRecurringInput }, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            const { data, error } = await supabase
                .from('recurring_transactions')
                .update(input)
                .eq('id', id)
                .eq('user_id', user.id)
                .select('*, category:categories(*)')
                .single();

            if (error) throw error;
            return mapDbToRecurring(data);
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const deleteRecurring = createAsyncThunk(
    'recurring/deleteRecurring',
    async (id: string, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            const { error } = await supabase
                .from('recurring_transactions')
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

// Slice
const recurringSlice = createSlice({
    name: 'recurring',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchRecurring.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchRecurring.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchRecurring.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            // Create
            .addCase(createRecurring.fulfilled, (state, action) => {
                state.items.push(action.payload);
                state.items.sort((a, b) => new Date(a.next_date).getTime() - new Date(b.next_date).getTime());
            })
            // Update
            .addCase(updateRecurring.fulfilled, (state, action) => {
                const index = state.items.findIndex(r => r.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                    state.items.sort((a, b) => new Date(a.next_date).getTime() - new Date(b.next_date).getTime());
                }
            })
            // Delete
            .addCase(deleteRecurring.fulfilled, (state, action) => {
                state.items = state.items.filter(r => r.id !== action.payload);
            })
            // Check
            .addCase(checkRecurringTransactions.fulfilled, (state, action) => {
                // If transactions were processed (count > 0), we should probably re-fetch transactions/recurring
                // But for now, we just log it or maybe trigger a reload of recurring items?
                // Actually, if we processed items, the `next_date` changed in DB.
                // We should re-fetch recurring items to get updated next dates.
            });
    },
});

// Selectors
// Selectors
export const selectRecurring = (state: any): RecurringTransaction[] => {
    return state.recurring.items.map((item: SerializableRecurringTransaction) => ({
        ...item,
        // If created_at and updated_at were missing from the interface, we'd add them here,
        // but they are part of the object, just strings.
        // Wait, RecurringTransaction types usually have Dates?
        // Let's assume RecurringTransaction from types has Dates for created_at/updated_at.
        created_at: item.created_at, // The DB type probably has string, but the Domain type might expect string or date?
        // Checking types/recurring.ts would confirm.
        // Usually Supabase returns strings.
        // If the Domain Type `RecurringTransaction` expects Dates (which is typical for this codebase),
        // we should convert them.
        // BUT, looking at `mapDbToRecurring` original, it didn't convert `created_at` or `updated_at` to Date!
        // It returned `row.created_at` directly.
        // Only `category.createdAt` was converted.
        // Let's stick to what was there but handle category correctly.
        category: item.category ? {
            ...item.category,
            createdAt: new Date(item.category.createdAt),
            updatedAt: new Date(item.category.updatedAt),
        } : undefined
    } as RecurringTransaction));
};
export const selectRecurringStatus = (state: any) => state.recurring.status;
export const selectRecurringError = (state: any) => state.recurring.error;

export default recurringSlice.reducer;
