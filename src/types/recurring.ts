import { Category } from './category';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurringStatus = 'active' | 'paused';

export interface RecurringTransaction {
    id: string;
    user_id: string;
    name: string;
    amount: number;
    category_id: string | null;
    category?: Category;
    frequency: RecurringFrequency;
    next_date: string;
    status: RecurringStatus;
    created_at: string;
    updated_at: string;
}

export type CreateRecurringInput = Omit<RecurringTransaction, 'id' | 'user_id' | 'category' | 'created_at' | 'updated_at'>;
export type UpdateRecurringInput = Partial<CreateRecurringInput>;
