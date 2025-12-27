import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import { apiSlice } from './features/api/apiSlice';
// Slices will be imported here as they are created
import transactionsReducer from './features/transactions/transactionsSlice';
import categoriesReducer from './features/categories/categoriesSlice';
import budgetsReducer from './features/budgets/budgetsSlice';
import recurringReducer from './features/recurring/recurringSlice';
import insightsReducer from './features/insights/insightsSlice';

export const makeStore = () => {
    return configureStore({
        reducer: {
            [apiSlice.reducerPath]: apiSlice.reducer,
            auth: authReducer,
            transactions: transactionsReducer,
            categories: categoriesReducer,
            budgets: budgetsReducer,
            recurring: recurringReducer,
            insights: insightsReducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(apiSlice.middleware),
    });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
