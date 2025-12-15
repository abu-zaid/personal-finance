'use client';

import { PageTransition } from '@/components/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared';
import { Wallet } from 'lucide-react';

export default function BudgetsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Budgets</h2>
            <p className="text-muted-foreground">Manage your monthly spending limits</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>December 2025</CardTitle>
            <CardDescription>Set and track your budget for this month</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Wallet className="h-12 w-12" />}
              title="No budget set"
              description="Create a budget to start tracking your spending against your goals."
              action={{
                label: 'Create Budget',
                onClick: () => {},
              }}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
