import { startOfMonth, endOfMonth, format } from 'date-fns';

import { getDashboardData } from '@/lib/api/dashboard';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardSummary } from '@/components/dashboard/dashboard-summary';
import { SpendingOverview } from '@/components/dashboard/spending-overview';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const data = await getDashboardData();

    if (!data) {
        redirect('/login');
    }

    const {
        user,
        monthlyIncome,
        monthlyExpense,
        transactions,
        currentBudget,
        allMonthExpenses,
        categories
    } = data;

    // Calculate metrics
    const totalBalance = monthlyIncome - monthlyExpense;

    // Today's Spending
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const expensesList = allMonthExpenses || [];
    const todaySpending = expensesList
        .filter(t => (typeof t.date === 'string' ? t.date.startsWith(todayStr) : format(t.date, 'yyyy-MM-dd') === todayStr))
        .reduce((sum, t) => sum + Number(t.amount), 0);

    // Daily Allowance
    let dailyAllowance = 0;
    if (currentBudget) {
        const budgetRemaining = currentBudget.total_amount - monthlyExpense;
        const today = new Date();
        const lastDayOfMonth = endOfMonth(today);
        const daysRemaining = Math.max(1, lastDayOfMonth.getDate() - today.getDate() + 1);
        const dailyBudget = budgetRemaining / daysRemaining;
        dailyAllowance = dailyBudget - todaySpending;
    }

    // Default symbol - we can get this from user preferences if we had them stored, otherwise default
    const symbol = '₹';

    return (
        <div className="min-h-screen bg-neutral-50/50 dark:bg-background pb-24 lg:pb-8">
            <div className="max-w-md lg:max-w-7xl mx-auto px-4 lg:px-8 space-y-6 lg:space-y-8">
                <DashboardHeader user={user} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left Column: Stats & Charts */}
                    <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                        <DashboardSummary
                            totalBalance={totalBalance}
                            monthlyIncome={monthlyIncome}
                            monthlyExpense={monthlyExpense}
                            todaySpending={todaySpending}
                            dailyAllowance={dailyAllowance}
                            symbol={symbol}
                            hasBudget={!!currentBudget}
                        />

                        <SpendingOverview
                            expenses={expensesList}
                        />
                    </div>

                    {/* Right Column: Transactions */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-6">
                            <RecentTransactions
                                transactions={transactions}
                                categories={categories}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
