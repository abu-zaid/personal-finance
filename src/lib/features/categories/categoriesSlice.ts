import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types';
import { createClient } from '@/lib/supabase/client';

// Helper to define Serializable Category for Redux
interface SerializableCategory extends Omit<Category, 'createdAt' | 'updatedAt'> {
    createdAt: string;
    updatedAt: string;
}

interface CategoriesState {
    items: SerializableCategory[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: CategoriesState = {
    items: [],
    status: 'idle',
    error: null,
};

// Map DB row to SerializableCategory
function mapDbToCategory(row: any): SerializableCategory {
    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        icon: row.icon,
        color: row.color,
        isDefault: row.is_default,
        order: row.sort_order,
        createdAt: row.created_at, // Keep as string from DB
        updatedAt: row.updated_at, // Keep as string from DB
    };
}

import { DEMO_CATEGORIES } from '@/lib/demo-data';

// ...

// Async Thunks
export const fetchCategories = createAsyncThunk(
    'categories/fetchCategories',
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user, isDemo } = state.auth;
        const supabase = createClient();

        if (isDemo) {
            return DEMO_CATEGORIES.map(c => ({
                id: c.id,
                userId: c.userId,
                name: c.name,
                icon: c.icon,
                color: c.color,
                isDefault: c.isDefault,
                order: c.order,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString(),
            }));
        }

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', user.id)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            return (data || []).map(mapDbToCategory);
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const createCategory = createAsyncThunk(
    'categories/createCategory',
    async (input: CreateCategoryInput, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const { items } = state.categories;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            const { data, error } = await supabase
                .from('categories')
                .insert({
                    user_id: user.id,
                    name: input.name,
                    icon: input.icon,
                    color: input.color,
                    is_default: false,
                    sort_order: items.length,
                })
                .select()
                .single();

            if (error) throw error;
            return mapDbToCategory(data);
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const updateCategory = createAsyncThunk(
    'categories/updateCategory',
    async ({ id, input }: { id: string; input: UpdateCategoryInput }, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            const updateData: Record<string, unknown> = {};
            if (input.name !== undefined) updateData.name = input.name;
            if (input.icon !== undefined) updateData.icon = input.icon;
            if (input.color !== undefined) updateData.color = input.color;
            if (input.order !== undefined) updateData.sort_order = input.order;

            const { data, error } = await supabase
                .from('categories')
                .update(updateData)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;
            return mapDbToCategory(data);
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const deleteCategory = createAsyncThunk(
    'categories/deleteCategory',
    async (id: string, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const { user } = state.auth;
        const supabase = createClient();

        if (!user || !supabase) return rejectWithValue('User not authenticated');

        try {
            const { error } = await supabase
                .from('categories')
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

const categoriesSlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {
        setCategories: (state, action: PayloadAction<any[]>) => {
            // We assume payload is already compatible or we map it
            state.items = action.payload.map(c => ({
                id: c.id,
                userId: c.userId,
                name: c.name,
                icon: c.icon,
                color: c.color,
                isDefault: c.isDefault,
                order: c.order,
                createdAt: c.createdAt.toString(),
                updatedAt: c.updatedAt.toString(),
            }));
            state.status = 'succeeded';
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchCategories.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            // Create
            .addCase(createCategory.fulfilled, (state, action) => {
                state.items.push(action.payload);
            })
            // Update
            .addCase(updateCategory.fulfilled, (state, action) => {
                const index = state.items.findIndex(c => c.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            // Delete
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.items = state.items.filter(c => c.id !== action.payload);
            });
    },
});

// Selectors
export const selectCategories = (state: any): Category[] => {
    return state.categories.items.map((item: SerializableCategory) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
    }));
};
export const selectCategoriesStatus = (state: any) => state.categories.status;
export const selectCategoriesError = (state: any) => state.categories.error;

export const { setCategories } = categoriesSlice.actions;

export default categoriesSlice.reducer;
