'use client';

import { PageTransition } from '@/components/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared';
import { ListOrdered } from 'lucide-react';

export default function TransactionsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
            <p className="text-muted-foreground">View and manage all your expenses</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>A complete list of your expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<ListOrdered className="h-12 w-12" />}
              title="No transactions yet"
              description="Start tracking your expenses by adding your first transaction."
              action={{
                label: 'Add Transaction',
                onClick: () => {},
              }}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
