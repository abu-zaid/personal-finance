'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { DashboardSkeleton } from '@/components/shared';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();
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
      <div className="bg-background flex min-h-screen">
        <aside className="bg-sidebar border-sidebar-border hidden h-screen w-64 border-r md:block">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <div className="bg-muted h-8 w-8 animate-pulse rounded-lg" />
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
          </div>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="bg-background flex h-16 items-center justify-between border-b px-6">
            <div className="bg-muted h-6 w-32 animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="bg-muted h-9 w-9 animate-pulse rounded" />
              <div className="bg-muted h-9 w-9 animate-pulse rounded-full" />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
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
    <div className="bg-background flex min-h-screen">
      <Sidebar onAddExpense={() => setAddExpenseOpen(true)} />
      <div className="flex flex-1 flex-col">
        <Header title={getPageTitle()} onAddExpense={() => setAddExpenseOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>

      {/* Add Expense Modal will be added here later */}
    </div>
  );
}
