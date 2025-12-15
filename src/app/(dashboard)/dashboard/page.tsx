'use client';

import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageTransition, StaggerContainer, StaggerItem, AnimatedNumber } from '@/components/animations';
import { EmptyState } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

// Temporary mock data - will be replaced with real data later
const mockStats = {
  totalSpent: 2847.5,
  budget: 4000,
  transactions: 47,
  topCategory: 'Groceries',
};

const mockRecentTransactions = [
  { id: '1', name: 'Grocery Store', category: 'Groceries', amount: -85.20, date: '2025-12-15' },
  { id: '2', name: 'Gas Station', category: 'Transportation', amount: -45.00, date: '2025-12-14' },
  { id: '3', name: 'Restaurant', category: 'Dining', amount: -32.50, date: '2025-12-14' },
  { id: '4', name: 'Netflix', category: 'Entertainment', amount: -15.99, date: '2025-12-13' },
  { id: '5', name: 'Amazon', category: 'Shopping', amount: -67.89, date: '2025-12-12' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const budgetPercentage = (mockStats.totalSpent / mockStats.budget) * 100;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Welcome Message */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}!
          </h2>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your finances this month.
          </p>
        </div>

        {/* Stats Grid */}
        <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <TrendingDown className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedNumber value={mockStats.totalSpent} format="currency" />
                </div>
                <p className="text-muted-foreground text-xs">This month</p>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Remaining</CardTitle>
                <Wallet className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedNumber
                    value={mockStats.budget - mockStats.totalSpent}
                    format="currency"
                  />
                </div>
                <Progress value={budgetPercentage} className="mt-2" />
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <CreditCard className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedNumber value={mockStats.transactions} />
                </div>
                <p className="text-muted-foreground text-xs">This month</p>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Category</CardTitle>
                <TrendingUp className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.topCategory}</div>
                <p className="text-muted-foreground text-xs">Highest spending</p>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Budget Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
              <CardDescription>Your spending progress this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Spent</span>
                  <span className="font-medium">{formatCurrency(mockStats.totalSpent)}</span>
                </div>
                <Progress value={budgetPercentage} className="h-3" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Budget</span>
                  <span className="font-medium">{formatCurrency(mockStats.budget)}</span>
                </div>
              </div>
              <Button variant="outline" className="mt-4 w-full">
                View Budget Details
              </Button>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest expenses</CardDescription>
            </CardHeader>
            <CardContent>
              {mockRecentTransactions.length === 0 ? (
                <EmptyState
                  title="No transactions yet"
                  description="Start tracking your expenses by adding your first transaction."
                  action={{
                    label: 'Add Transaction',
                    onClick: () => {},
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {mockRecentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{transaction.name}</p>
                        <p className="text-muted-foreground text-xs">{transaction.category}</p>
                      </div>
                      <span className="text-destructive font-medium">
                        {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    View All Transactions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
