import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UserPreferences, Currency, DateFormat, Theme } from '@/types';
import { createClient } from '@/lib/supabase/client';
// import { RootState } from '@/lib/store';

// Helper to define Serializable User for Redux
interface SerializableUser extends Omit<User, 'createdAt' | 'updatedAt' | 'preferences'> {
    createdAt: string;
    updatedAt: string;
    preferences: UserPreferences;
}

interface AuthState {
    user: SerializableUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isConfigured: boolean;
    preferencesLoaded: boolean;
    error: string | null;
}

const defaultPreferences: UserPreferences = {
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    theme: 'system',
    firstDayOfWeek: 0,
};

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isConfigured: false,
    preferencesLoaded: false,
    error: null,
};

// Async Thunks
export const initializeAuth = createAsyncThunk(
    'auth/initialize',
    async (_, { dispatch }) => {
        const supabase = createClient();
        if (!supabase) return { isConfigured: false, user: null };

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            // We can trigger preference fetch here or let the listener handle it
            // For now, let's just return the user
            return { isConfigured: true, user: mapSupabaseUserToSerializable(session.user) };
        }
        return { isConfigured: true, user: null };
    }
);

export const fetchUserPreferences = createAsyncThunk(
    'auth/fetchPreferences',
    async (userId: string) => {
        const supabase = createClient();
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore not found error
            throw error;
        }

        if (data) {
            return {
                currency: data.currency as Currency,
                dateFormat: data.date_format as DateFormat,
                theme: data.theme as Theme,
                firstDayOfWeek: data.first_day_of_week as 0 | 1,
            };
        }
        return defaultPreferences;
    }
);

export const updatePreferences = createAsyncThunk(
    'auth/updatePreferences',
    async (preferences: Partial<UserPreferences>, { getState }) => {
        const state = getState() as any;
        const user = state.auth.user;
        const supabase = createClient();

        if (!user || !supabase) throw new Error('Cannot update preferences');

        const currentPreferences = user.preferences;
        const updatedPreferences = { ...currentPreferences, ...preferences };

        const { error } = await supabase
            .from('user_preferences')
            .upsert({
                user_id: user.id,
                currency: updatedPreferences.currency,
                date_format: updatedPreferences.dateFormat,
                theme: updatedPreferences.theme,
                first_day_of_week: updatedPreferences.firstDayOfWeek,
            }, {
                onConflict: 'user_id',
            });

        if (error) throw error;
        return updatedPreferences;
    }
);

export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (name: string, { rejectWithValue }) => {
        const supabase = createClient();
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase.auth.updateUser({
            data: { full_name: name }
        });

        if (error) throw error;

        // Return the name to update local state
        return name;
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async () => {
        const supabase = createClient();
        if (supabase) {
            await supabase.auth.signOut();
        }
    }
);

export const signInWithGoogle = createAsyncThunk(
    'auth/signInWithGoogle',
    async () => {
        const supabase = createClient();
        if (!supabase) throw new Error('Supabase not configured');

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        if (error) throw error;
    }
);

// Helpers
const mapSupabaseUserToSerializable = (supaUser: any): SerializableUser => {
    return {
        id: supaUser.id,
        email: supaUser.email || '',
        name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || 'User',
        avatarUrl: supaUser.user_metadata?.avatar_url || supaUser.user_metadata?.picture,
        preferences: defaultPreferences,
        createdAt: supaUser.created_at,
        updatedAt: supaUser.updated_at || supaUser.created_at,
    };
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<SerializableUser | null>) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
            state.isLoading = false;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Initialize
            .addCase(initializeAuth.fulfilled, (state, action) => {
                state.isConfigured = action.payload.isConfigured;
                if (action.payload.user) {
                    state.user = action.payload.user;
                    state.isAuthenticated = true;
                }
                state.isLoading = false;
            })
            // Fetch Preferences
            .addCase(fetchUserPreferences.pending, (state) => {
                state.preferencesLoaded = false;
            })
            .addCase(fetchUserPreferences.fulfilled, (state, action) => {
                if (state.user) {
                    state.user.preferences = action.payload;
                }
                state.preferencesLoaded = true;
            })
            .addCase(fetchUserPreferences.rejected, (state) => {
                // Even on error, mark as loaded to prevent infinite loading
                state.preferencesLoaded = true;
            })
            // Update Preferences
            .addCase(updatePreferences.fulfilled, (state, action) => {
                if (state.user) {
                    state.user.preferences = action.payload;
                    state.user.updatedAt = new Date().toISOString();
                }
            })
            // Update Profile
            .addCase(updateProfile.fulfilled, (state, action) => {
                if (state.user) {
                    state.user.name = action.payload;
                    state.user.updatedAt = new Date().toISOString();
                }
            })
            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.preferencesLoaded = false;
            });
    },
});

export const { setUser, setLoading } = authSlice.actions;

// Selectors
export const selectAuth = (state: any) => state.auth;
export const selectUser = (state: any) => {
    const user = state.auth.user;
    if (!user) return null;
    // Convert strings back to Dates for component consumption
    return {
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
    } as User;
};
export const selectIsAuthenticated = (state: any): boolean => state.auth.isAuthenticated;
export const selectPreferencesLoaded = (state: any): boolean => state.auth.preferencesLoaded;

export default authSlice.reducer;
