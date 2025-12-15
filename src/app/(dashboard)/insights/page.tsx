'use client';

import { PageTransition } from '@/components/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared';
import { BarChart3 } from 'lucide-react';

export default function InsightsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Insights</h2>
            <p className="text-muted-foreground">Understand your spending patterns</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Spending Analysis</CardTitle>
            <CardDescription>Visual breakdown of your expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<BarChart3 className="h-12 w-12" />}
              title="Not enough data"
              description="Add more transactions to see insights about your spending patterns."
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
