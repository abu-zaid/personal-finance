'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { DataProviders } from '@/components/providers/data-providers';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { DashboardSkeleton, ErrorBoundary } from '@/components/shared';
import { TransactionModal } from '@/components/features/transactions';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useAuth();
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-background flex h-screen overflow-hidden">
        <aside className="bg-sidebar border-sidebar-border hidden h-full w-64 border-r lg:block">
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
            <div className="bg-muted h-10 w-10 animate-pulse rounded-xl" />
            <div className="bg-muted h-5 w-24 animate-pulse rounded" />
          </div>
        </aside>
        <div className="flex flex-1 flex-col min-h-0">
          <header className="bg-background flex h-16 flex-shrink-0 items-center justify-between border-b border-border px-4 lg:px-6">
            <div className="bg-muted h-6 w-32 animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="bg-muted h-10 w-10 animate-pulse rounded-full" />
              <div className="bg-muted h-10 w-10 animate-pulse rounded-full" />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 pb-[100px] md:pb-6 lg:p-6">
            <DashboardSkeleton />
          </main>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Get page title from pathname
  const getPageTitle = () => {
    const path = pathname.split('/').pop();
    if (!path || path === 'dashboard') return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <DataProviders>
      <div className="bg-background flex h-screen overflow-hidden">
        <Sidebar onAddExpense={() => setAddExpenseOpen(true)} />
        <div className="flex flex-1 flex-col min-h-0">
          <Header title={getPageTitle()} />
          <main className="flex-1 overflow-auto p-4 pb-[100px] md:pb-6 lg:p-6 scrollbar-hide">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
        {/* Mobile Bottom Navigation */}
        <BottomNav onAddExpense={() => setAddExpenseOpen(true)} />
        <TransactionModal open={addExpenseOpen} onOpenChange={setAddExpenseOpen} />
      </div>
    </DataProviders>
  );
}
