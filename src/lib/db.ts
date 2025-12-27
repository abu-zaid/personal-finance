import Dexie, { Table } from 'dexie';
import {
    Transaction, Category, Budget, Goal, RecurringTransaction,
    UserPreferences, SyncQueueEntry, BudgetAllocation
} from './schemas';

export class FinanceDB extends Dexie {
    transactions!: Table<Transaction, string>;
    categories!: Table<Category, string>;
    budgets!: Table<Budget, string>;
    budget_allocations!: Table<BudgetAllocation, string>;
    goals!: Table<Goal, string>;
    recurring_transactions!: Table<RecurringTransaction, string>;
    user_preferences!: Table<UserPreferences, string>;
    sync_queue!: Table<SyncQueueEntry, number>;

    constructor() {
        super('PersonalFinanceDB');
        this.version(1).stores({
            transactions: 'id, user_id, date, category_id, synced',
            categories: 'id, user_id, name, [user_id+name]',
            budgets: 'id, user_id, month, [user_id+month]',
            budget_allocations: 'id, budget_id, category_id',
            goals: 'id, user_id',
            recurring_transactions: 'id, user_id, next_date',
            user_preferences: 'id, user_id',
            sync_queue: '++id, table, action, timestamp'
        });
    }
}

export const db = new FinanceDB();
