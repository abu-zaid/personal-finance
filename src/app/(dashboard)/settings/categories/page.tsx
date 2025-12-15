'use client';

import { PageTransition } from '@/components/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared';
import { Tags, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CategoriesPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
            <p className="text-muted-foreground">Manage your expense categories</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Categories</CardTitle>
            <CardDescription>Create and organize expense categories</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Tags className="h-12 w-12" />}
              title="No categories yet"
              description="Create categories to organize your expenses."
              action={{
                label: 'Create Category',
                onClick: () => {},
              }}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
