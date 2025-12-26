import { User, Transaction, Budget, Category, RecurringTransaction, TransactionType } from '@/types';
import { SmartInsight } from '@/types/summary'; // Correct import
import { subDays, subMonths, startOfMonth, startOfWeek, subWeeks } from 'date-fns';

export const DEMO_USER: User = {
    id: 'demo-user-id',
    email: 'demo@financeflow.app',
    name: 'Demo User',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    createdAt: new Date(),
    updatedAt: new Date(),
    preferences: {
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        theme: 'dark',
        firstDayOfWeek: 0,
    }
};

const CATEGORIES = [
    { id: 'cat-1', name: 'Housing', type: 'expense', color: '#EF4444', icon: 'home' }, // Fixed icon names to match CategoryIconOption loosely or string
    { id: 'cat-2', name: 'Food', type: 'expense', color: '#F97316', icon: 'utensils-crossed' },
    { id: 'cat-3', name: 'Transport', type: 'expense', color: '#EAB308', icon: 'car' },
    { id: 'cat-4', name: 'Entertainment', type: 'expense', color: '#8B5CF6', icon: 'film' },
    { id: 'cat-5', name: 'Shopping', type: 'expense', color: '#EC4899', icon: 'shopping-bag' },
    { id: 'cat-6', name: 'Salary', type: 'income', color: '#22C55E', icon: 'credit-card' },
    { id: 'cat-7', name: 'Freelance', type: 'income', color: '#10B981', icon: 'laptop' }, // laptop not in list, using fallback or adding to type if needed. keeping as string.
    { id: 'cat-8', name: 'Investments', type: 'income', color: '#06B6D4', icon: 'trending-up' }, // trending-up not in list
] as any[]; // Relaxing type for mock data icons to avoid strict check issues for now

export const DEMO_CATEGORIES: Category[] = CATEGORIES.map(c => ({
    ...c,
    userId: DEMO_USER.id,
    isDefault: true,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
}));

const getLocalMonthString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

const generateTransactions = (): Transaction[] => {
    const txs: Transaction[] = [];
    const now = new Date(); // Local time

    // Helper to Create Noon Date (Safe from timezone shifts)
    const createSafeDate = (d: Date) => {
        const safe = new Date(d);
        safe.setHours(12, 0, 0, 0);
        return safe;
    };

    // Salary - Monthly
    [0, 1, 2].forEach(monthOffset => {
        const date = subMonths(new Date(now.getFullYear(), now.getMonth(), 28), monthOffset);
        txs.push({
            id: `tx-salary-${monthOffset}`,
            userId: DEMO_USER.id,
            amount: 5000,
            type: 'income',
            categoryId: 'cat-6',
            date: createSafeDate(date),
            notes: 'Monthly Salary',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    });

    // Rent - Monthly
    [0, 1, 2].forEach(monthOffset => {
        const date = subMonths(new Date(now.getFullYear(), now.getMonth(), 1), monthOffset);
        txs.push({
            id: `tx-rent-${monthOffset}`,
            userId: DEMO_USER.id,
            amount: 1500,
            type: 'expense',
            categoryId: 'cat-1',
            date: createSafeDate(date),
            notes: 'Apartment Rent',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    });

    // Random Daily Expenses for last 3 months
    for (let i = 0; i < 90; i++) {
        if (Math.random() > 0.7) continue;

        const date = subDays(now, i);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        // Food
        if (Math.random() > 0.3) {
            txs.push({
                id: `tx-food-${i}`,
                userId: DEMO_USER.id,
                amount: Math.floor(Math.random() * 30) + 15,
                type: 'expense',
                categoryId: 'cat-2',
                date: createSafeDate(date),
                notes: Math.random() > 0.5 ? 'Grocery Store' : 'Lunch',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        // Transport
        if (Math.random() > 0.8) {
            txs.push({
                id: `tx-transport-${i}`,
                userId: DEMO_USER.id,
                amount: Math.floor(Math.random() * 40) + 10,
                type: 'expense',
                categoryId: 'cat-3',
                date: createSafeDate(date),
                notes: 'Uber Ride',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        // Entertainment
        if (isWeekend && Math.random() > 0.5) {
            txs.push({
                id: `tx-ent-${i}`,
                userId: DEMO_USER.id,
                amount: Math.floor(Math.random() * 80) + 30,
                type: 'expense',
                categoryId: 'cat-4',
                date: createSafeDate(date),
                notes: 'Night Out',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
    }

    // Sort by date desc
    return txs.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const DEMO_TRANSACTIONS = generateTransactions();

export const DEMO_BUDGETS: Budget[] = [
    {
        id: 'budget-1',
        userId: DEMO_USER.id,
        month: getLocalMonthString(new Date()), // Use local YYYY-MM
        totalAmount: 3000,
        allocations: [
            { categoryId: 'cat-1', amount: 1500 },
            { categoryId: 'cat-2', amount: 600 },
            { categoryId: 'cat-3', amount: 300 },
            { categoryId: 'cat-4', amount: 400 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
    }
];

export const DEMO_RECURRING: RecurringTransaction[] = [
    {
        id: 'rec-1',
        user_id: DEMO_USER.id,
        amount: 5000,
        name: 'Salary', // Changed from description to name as per Type
        category_id: 'cat-6',
        frequency: 'monthly',
        next_date: startOfMonth(new Date(new Date().setMonth(new Date().getMonth() + 1))).toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'rec-2',
        user_id: DEMO_USER.id,
        amount: 15.99,
        name: 'Netflix Subscription',
        category_id: 'cat-4',
        frequency: 'monthly',
        next_date: new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
];

export const DEMO_INSIGHTS: SmartInsight[] = [
    {
        id: 'insight-1',
        type: 'warning',
        title: 'High Food Spending',
        message: 'You have spent 20% more on dining out this week compared to last week.',
    },
    {
        id: 'insight-2',
        type: 'achievement',
        title: 'Savings Goal Reached',
        message: 'Congratulations! You saved $500 this month, hitting your 10% saving target.',
    }
];
