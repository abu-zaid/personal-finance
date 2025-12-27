import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { db } from '../../db';
import { syncManager } from '../../sync/sync-manager';
import { Transaction, Category, Budget, Goal, RecurringTransaction, BudgetAllocation } from '../../schemas';
import { v4 as uuidv4 } from 'uuid';

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fakeBaseQuery(),
    tagTypes: ['Transactions', 'Categories', 'Budgets', 'Goals', 'Recurring'],
    endpoints: (builder) => ({
        // ==========================================
        // Transactions
        // ==========================================
        getTransactions: builder.query<Transaction[], void>({
            queryFn: async () => {
                try {
                    const transactions = await db.transactions.orderBy('date').reverse().toArray();
                    const categories = await db.categories.toArray();

                    // Join category data
                    const transactionsWithCategories = transactions.map(tx => ({
                        ...tx,
                        category: categories.find(c => c.id === tx.category_id)
                    }));

                    return { data: transactionsWithCategories as Transaction[] };
                } catch (error) {
                    return { error };
                }
            },
            providesTags: ['Transactions'],
        }),

        addTransaction: builder.mutation<string, Omit<Transaction, 'id' | 'synced' | 'created_at' | 'updated_at'>>({
            queryFn: async (transaction) => {
                try {
                    const id = uuidv4();
                    const newTx: Transaction = {
                        ...transaction,
                        id,
                        synced: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };

                    await db.transaction('rw', db.transactions, db.sync_queue, async () => {
                        await db.transactions.add(newTx);
                        await db.sync_queue.add({
                            table: 'transactions',
                            action: 'create',
                            payload: newTx,
                            timestamp: Date.now(),
                        });
                    });

                    syncManager.pushChanges();
                    return { data: id };
                } catch (error) {
                    return { error };
                }
            },
            invalidatesTags: ['Transactions'],
        }),

        updateTransaction: builder.mutation<void, Transaction>({
            queryFn: async (transaction) => {
                try {
                    const updatedTx = { ...transaction, synced: 0, updated_at: new Date().toISOString() };

                    await db.transaction('rw', db.transactions, db.sync_queue, async () => {
                        await db.transactions.put(updatedTx);
                        await db.sync_queue.add({
                            table: 'transactions',
                            action: 'update',
                            payload: updatedTx,
                            timestamp: Date.now(),
                        });
                    });

                    syncManager.pushChanges();
                    return { data: undefined };
                } catch (error) {
                    return { error };
                }
            },
            invalidatesTags: ['Transactions'],
        }),

        deleteTransaction: builder.mutation<void, string>({
            queryFn: async (id) => {
                try {
                    await db.transaction('rw', db.transactions, db.sync_queue, async () => {
                        await db.transactions.delete(id);
                        await db.sync_queue.add({
                            table: 'transactions',
                            action: 'delete',
                            payload: { id },
                            timestamp: Date.now(),
                        });
                    });

                    syncManager.pushChanges();
                    return { data: undefined };
                } catch (error) {
                    return { error };
                }
            },
            invalidatesTags: ['Transactions'],
        }),

        // ==========================================
        // Categories
        // ==========================================
        getCategories: builder.query<Category[], void>({
            queryFn: async () => {
                try {
                    const data = await db.categories.toArray();
                    return { data };
                } catch (error) {
                    return { error };
                }
            },
            providesTags: ['Categories'],
        }),

        addCategory: builder.mutation<string, Omit<Category, 'id' | 'created_at' | 'updated_at'>>({
            queryFn: async (category) => {
                try {
                    const id = uuidv4();
                    const newCat: Category = {
                        ...category,
                        id,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };

                    await db.transaction('rw', db.categories, db.sync_queue, async () => {
                        await db.categories.add(newCat);
                        await db.sync_queue.add({
                            table: 'categories',
                            action: 'create',
                            payload: newCat,
                            timestamp: Date.now(),
                        });
                    });

                    syncManager.pushChanges();
                    return { data: id };
                } catch (error) {
                    return { error };
                }
            },
            invalidatesTags: ['Categories'],
        }),

        // ==========================================
        // Budgets
        // ==========================================
        getBudgets: builder.query<Budget[], void>({
            queryFn: async () => {
                try {
                    const data = await db.budgets.toArray();
                    return { data };
                } catch (error) {
                    return { error };
                }
            },
            providesTags: ['Budgets'],
        }),

        getBudgetAllocations: builder.query<BudgetAllocation[], void>({
            queryFn: async () => {
                try {
                    const data = await db.budget_allocations.toArray();
                    return { data };
                } catch (error) {
                    return { error };
                }
            },
            providesTags: ['Budgets'], // Share tag for simplicity
        }),

        addBudget: builder.mutation<string, { budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>, allocations: Omit<BudgetAllocation, 'id' | 'budget_id' | 'created_at' | 'updated_at'>[] }>({
            queryFn: async ({ budget, allocations }) => {
                try {
                    const budgetId = uuidv4();
                    const newBudget: Budget = {
                        ...budget,
                        id: budgetId,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };

                    const newAllocations: BudgetAllocation[] = allocations.map(a => ({
                        ...a,
                        id: uuidv4(),
                        budget_id: budgetId,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }));

                    await db.transaction('rw', db.budgets, db.budget_allocations, db.sync_queue, async () => {
                        await db.budgets.add(newBudget);
                        await db.budget_allocations.bulkAdd(newAllocations);

                        // Sync budget
                        await db.sync_queue.add({
                            table: 'budgets',
                            action: 'create',
                            payload: newBudget,
                            timestamp: Date.now(),
                        });

                        // Sync allocations (individual items for now, ideally batch)
                        for (const alloc of newAllocations) {
                            await db.sync_queue.add({
                                table: 'budget_allocations' as any, // Cast to any if strictly typed enum doesn't match yet
                                action: 'create',
                                payload: alloc,
                                timestamp: Date.now(),
                            });
                        }
                    });

                    syncManager.pushChanges();
                    return { data: budgetId };
                } catch (error) {
                    return { error };
                }
            },
            invalidatesTags: ['Budgets'],
        }),

        updateBudget: builder.mutation<void, { id: string, budget: Partial<Budget>, allocations: Omit<BudgetAllocation, 'id' | 'budget_id' | 'created_at' | 'updated_at'>[] }>({
            queryFn: async ({ id, budget, allocations }) => {
                try {
                    await db.transaction('rw', db.budgets, db.budget_allocations, db.sync_queue, async () => {
                        // 1. Update Budget
                        const existingBudget = await db.budgets.get(id);
                        if (!existingBudget) throw new Error("Budget not found");

                        const updatedBudget = { ...existingBudget, ...budget, updated_at: new Date().toISOString() };
                        await db.budgets.put(updatedBudget);
                        await db.sync_queue.add({
                            table: 'budgets',
                            action: 'update',
                            payload: updatedBudget,
                            timestamp: Date.now(),
                        });

                        // 2. Replace Allocations (Delete old, Add new) -> simplest for sync
                        const oldAllocations = await db.budget_allocations.where('budget_id').equals(id).toArray();
                        const oldIds = oldAllocations.map(a => a.id);

                        // Delete old
                        await db.budget_allocations.bulkDelete(oldIds);
                        for (const oldId of oldIds) {
                            await db.sync_queue.add({
                                table: 'budget_allocations' as any,
                                action: 'delete',
                                payload: { id: oldId },
                                timestamp: Date.now(),
                            });
                        }

                        // Add new
                        const newAllocations: BudgetAllocation[] = allocations.map(a => ({
                            ...a,
                            id: uuidv4(),
                            budget_id: id,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        }));
                        await db.budget_allocations.bulkAdd(newAllocations);
                        for (const alloc of newAllocations) {
                            await db.sync_queue.add({
                                table: 'budget_allocations' as any,
                                action: 'create',
                                payload: alloc,
                                timestamp: Date.now(),
                            });
                        }
                    });

                    syncManager.pushChanges();
                    return { data: undefined };
                } catch (error) {
                    return { error };
                }
            },
            invalidatesTags: ['Budgets'],
        }),

        // ... Implement other CRUD as needed (Goals, Recurring)
    }),
});

export const {
    useGetTransactionsQuery,
    useAddTransactionMutation,
    useUpdateTransactionMutation,
    useDeleteTransactionMutation,
    useGetCategoriesQuery,
    useAddCategoryMutation,
    useGetBudgetsQuery,
    useGetBudgetAllocationsQuery,
    useAddBudgetMutation,
    useUpdateBudgetMutation,
} = apiSlice;
