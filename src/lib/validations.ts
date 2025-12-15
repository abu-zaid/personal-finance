import { z } from 'zod';

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Signup schema
export const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

// Transaction schema
export const transactionSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Please enter a valid amount' })
    .positive('Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Please select a category'),
  date: z.date(),
  notes: z.string().optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

// Category schema
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(30, 'Name must be less than 30 characters'),
  icon: z.string().min(1, 'Please select an icon'),
  color: z.string().min(1, 'Please select a color'),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// Budget allocation schema
export const budgetAllocationSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  amount: z.number().min(0, 'Amount must be at least 0'),
});

// Budget schema
export const budgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format'),
  totalAmount: z.number().positive('Total budget must be greater than 0'),
  allocations: z.array(budgetAllocationSchema),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;

// User preferences schema
export const userPreferencesSchema = z.object({
  currency: z.enum(['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP']),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  theme: z.enum(['light', 'dark', 'system']),
  firstDayOfWeek: z.union([z.literal(0), z.literal(1)]),
});

export type UserPreferencesFormData = z.infer<typeof userPreferencesSchema>;
