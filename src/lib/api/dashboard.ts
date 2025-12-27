import { createClient } from '@/lib/supabase/server';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { User } from '@/types';

export async function getDashboardData() {
    const supabase = await createClient();

    if (!supabase) {
        return {
            user: null,
            monthlyIncome: 0,
            monthlyExpense: 0,
            transactions: [],
            dailyStats: [],
            currentBudget: null,
            categories: [],
            allMonthExpenses: [],
        };
    }

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
        return null;
    }

    // Map to App User
    const user: User = {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        avatarUrl: authUser.user_metadata?.avatar_url,
        createdAt: new Date(authUser.created_at),
        updatedAt: new Date(), // approximate
        preferences: {
            currency: 'INR', // Default or fetch
            dateFormat: 'DD/MM/YYYY',
            theme: 'system',
            firstDayOfWeek: 1
        }
    };

    // Note: If you have a profiles table, fetch it here:
    // const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
    // if (profile) { ...merge }


    const today = new Date();
    const startDate = startOfMonth(today).toISOString();
    const endDate = endOfMonth(today).toISOString();
    const monthStr = format(today, 'yyyy-MM');

    // Parallelize fetches
    const [
        transactionsRes,
        incomeRes,
        expenseRes,
        budgetRes,
        dailyStatsRes,
        categoriesRes
    ] = await Promise.all([
        // 1. Recent Transactions
        supabase
            .from('transactions')
            .select('*, categories(*)')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(10),

        // 2. Monthly Income
        supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('type', 'income')
            .gte('date', startDate)
            .lte('date', endDate),

        // 3. Monthly Expense
        supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('type', 'expense')
            .gte('date', startDate)
            .lte('date', endDate),

        // 4. Current Budget
        supabase
            .from('budgets')
            .select('*')
            .eq('user_id', user.id)
            .eq('month', monthStr)
            .single(),

        // 5. Daily Stats (for chart) - optimized query
        supabase.rpc('get_daily_spending', {
            p_user_id: user.id,
            p_month: monthStr
        }),

        // 6. Categories
        supabase
            .from('categories')
            .select('*')
    ]);

    // Aggregate Income/Expense
    const monthlyIncome = (incomeRes.data || []).reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlyExpense = (expenseRes.data || []).reduce((sum, t) => sum + Number(t.amount), 0);

    // Transform Daily Stats if RPC not available (fallback) or process RPC result
    // If RPC is missing, we might need a raw query or aggregation in JS.
    // For now, let's assume we might need to aggregate manually if RPC fails or isn't set up.
    // Since we are refactoring, let's stick to safe JS aggregation for now to avoid DB migration requirements
    // unless user strictly asked for it.
    // Actually, let's fetch ALL expenses for the month for the chart to be accurate.

    const allMonthExpensesRes = await supabase
        .from('transactions')
        .select('amount, date, type, category_id, categories(id, name, color, icon)')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', startDate)
        .lte('date', endDate);



    // Map transactions to App Type (snake_case -> camelCase)
    const transactions = (transactionsRes.data || []).map((t: any) => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        date: t.date,
        categoryId: t.category_id,
        notes: t.notes,
        userId: t.user_id,
        // Map joined category data directly to 'category' property
        category: t.categories ? {
            id: t.categories.id,
            name: t.categories.name,
            icon: t.categories.icon,
            color: t.categories.color
        } : undefined,
        createdAt: new Date(t.created_at || t.date), // Fallback
        updatedAt: new Date(t.updated_at || t.date), // Fallback
    }));

    // Map allMonthExpenses
    const allMonthExpenses = (allMonthExpensesRes.data || []).map((t: any) => ({
        ...t,
        categoryId: t.category_id, // Map standard key
        amount: Number(t.amount),
        category: t.categories ? { // consistent mapping
            id: t.categories.id, // Ensure id is present
            name: t.categories.name,
            color: t.categories.color,
            icon: t.categories.icon
        } : undefined
    }));

    // Map categories to App Type
    const categories: any[] = (categoriesRes.data || []).map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        isDefault: c.is_default,
        order: c.order,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at)
    }));

    return {
        user,
        monthlyIncome,
        monthlyExpense,
        transactions,
        currentBudget: budgetRes.data || null,
        allMonthExpenses,
        categories,
    };
}
