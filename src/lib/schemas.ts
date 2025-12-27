import { z } from 'zod';

// ==========================================
// Enums
// ==========================================
export const TransactionTypeEnum = z.enum(['income', 'expense']);
export type TransactionType = z.infer<typeof TransactionTypeEnum>;

export const RecurringFrequencyEnum = z.enum(['daily', 'weekly', 'monthly', 'yearly']);
export type RecurringFrequency = z.infer<typeof RecurringFrequencyEnum>;

export const RecurringStatusEnum = z.enum(['active', 'paused']);
export type RecurringStatus = z.infer<typeof RecurringStatusEnum>;

// ==========================================
// Base Schemas (Shared Fields)
// ==========================================
const BaseEntity = z.object({
    id: z.string().uuid(),
    created_at: z.string().optional(), // ISO String
    updated_at: z.string().optional(), // ISO String
});

// ==========================================
// User Preferences
// ==========================================
export const UserPreferencesSchema = BaseEntity.extend({
    user_id: z.string().uuid(),
    currency: z.string().default('USD'),
    date_format: z.string().default('MM/DD/YYYY'),
    theme: z.enum(['system', 'light', 'dark']).default('system'),
    first_day_of_week: z.number().min(0).max(6).default(0),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// ==========================================
// Categories
// ==========================================
export const CategorySchema = BaseEntity.extend({
    user_id: z.string().uuid(),
    name: z.string().min(1, 'Name is required'),
    icon: z.string().default('more-horizontal'),
    color: z.string().default('#6366f1'),
    is_default: z.boolean().default(false),
    sort_order: z.number().default(0),
    type: TransactionTypeEnum.default('expense'), // Note: Schema.sql doesn't strictly have type here but it's good practice for filtering
});
export type Category = z.infer<typeof CategorySchema>;

// ==========================================
// Transactions
// ==========================================
export const TransactionSchema = BaseEntity.extend({
    user_id: z.string().uuid(),
    amount: z.coerce.number().positive('Amount must be positive'),
    type: TransactionTypeEnum,
    category_id: z.string().uuid().nullable(),
    date: z.string(), // YYYY-MM-DD
    notes: z.string().nullable().optional(),
    synced: z.number().optional(), // For Dexie Local Sync (0=unsynced, 1=synced)
});
export type Transaction = z.infer<typeof TransactionSchema>;

// Join Type for UI
export const TransactionWithCategorySchema = TransactionSchema.extend({
    category: CategorySchema.nullable().optional(),
});
export type TransactionWithCategory = z.infer<typeof TransactionWithCategorySchema>;

// ==========================================
// Budgets
// ==========================================
export const BudgetSchema = BaseEntity.extend({
    user_id: z.string().uuid(),
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM'), // YYYY-MM
    total_amount: z.coerce.number().positive(),
});
export type Budget = z.infer<typeof BudgetSchema>;

export const BudgetAllocationSchema = BaseEntity.extend({
    budget_id: z.string().uuid(),
    category_id: z.string().uuid(),
    amount: z.coerce.number().positive(),
});
export type BudgetAllocation = z.infer<typeof BudgetAllocationSchema>;

// Join Type for UI
export const BudgetWithAllocationsSchema = BudgetSchema.extend({
    allocations: z.array(BudgetAllocationSchema).optional(),
});
export type BudgetWithAllocations = z.infer<typeof BudgetWithAllocationsSchema>;

// ==========================================
// Goals
// ==========================================
export const GoalSchema = BaseEntity.extend({
    user_id: z.string().uuid(),
    name: z.string().min(1, 'Name is required'),
    target_amount: z.coerce.number().positive(),
    current_amount: z.coerce.number().default(0),
    icon: z.string().default('Target'),
    color: z.string().default('#98EF5A'),
    deadline: z.string().nullable().optional(), // YYYY-MM-DD
});
export type Goal = z.infer<typeof GoalSchema>;

// ==========================================
// Recurring Transactions
// ==========================================
export const RecurringTransactionSchema = BaseEntity.extend({
    user_id: z.string().uuid(),
    name: z.string().min(1, 'Name is required'),
    amount: z.coerce.number().positive(),
    type: TransactionTypeEnum,
    category_id: z.string().uuid().nullable(),
    frequency: RecurringFrequencyEnum,
    next_date: z.string(), // YYYY-MM-DD
    status: RecurringStatusEnum.default('active'),
});
export type RecurringTransaction = z.infer<typeof RecurringTransactionSchema>;

// ==========================================
// Sync Queue (Dexie-only)
// ==========================================
export const SyncQueueActionEnum = z.enum(['create', 'update', 'delete']);
export type SyncQueueAction = z.infer<typeof SyncQueueActionEnum>;

export const SyncQueueSchema = z.object({
    id: z.number().optional(), // Auto-generated by Dexie (++id)
    table: z.enum(['transactions', 'categories', 'budgets', 'goals', 'recurring_transactions']),
    action: SyncQueueActionEnum,
    payload: z.any(), // The data to sync
    timestamp: z.number(), // Date.now()
});
export type SyncQueueEntry = z.infer<typeof SyncQueueSchema>;
