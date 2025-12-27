import { createSlice } from '@reduxjs/toolkit';

// DEPRECATED: This slice is being replaced by RTK Query in apiSlice.ts
// Keeping minimal state to prevent build errors until fully removed from store.ts

interface BudgetsState {
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: BudgetsState = {
    status: 'idle',
};

const budgetsSlice = createSlice({
    name: 'budgets',
    initialState,
    reducers: {},
});

export default budgetsSlice.reducer;

// Export empty selectors to satisfy any lingering imports (though ideally none should exist)
export const selectBudgets = (state: any) => [];
export const selectCurrentBudget = (state: any) => null;
export const selectBudgetsStatus = (state: any) => state.budgets.status;
