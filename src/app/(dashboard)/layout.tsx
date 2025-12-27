'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { DataProviders } from '@/components/providers/data-providers';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ErrorBoundary } from '@/components/shared';
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton';
import { TransactionModal } from '@/components/features/transactions';
import { useSequenceShortcuts, useShortcuts } from '@/hooks/use-shortcuts';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthenticated, preferencesLoaded } = useAuth();
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  // Initialize global shortcuts
  useSequenceShortcuts();
  useShortcuts({
    n: () => setAddExpenseOpen(true),
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Timeout safety for infinite loading
  const [longLoading, setLongLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading || (isAuthenticated && !preferencesLoaded)) {
      timer = setTimeout(() => setLongLoading(true), 4000);
    }
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, preferencesLoaded]);

  // Show loading state while auth is loading OR preferences are loading
  // This prevents flash of wrong currency symbol
  if (isLoading || (isAuthenticated && !preferencesLoaded)) {
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
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 pb-[100px] md:pb-6 lg:p-6 flex flex-col items-center justify-center">
            {longLoading ? (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">Taking longer than expected...</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium transition-colors hover:bg-primary/90"
                >
                  Reload Application
                </button>
              </div>
            ) : (
              <DashboardSkeleton />
            )}
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
          <main className={cn(
            "flex-1 overflow-x-hidden scrollbar-hide max-w-[100vw]",
            pathname === '/transactions' ? "flex flex-col overflow-hidden" : "overflow-y-auto",
            "will-change-contents" // Hint to browser for optimization
          )}
            style={{ contentVisibility: 'auto' }} // Render optimization
          >
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
