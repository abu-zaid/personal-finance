'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ErrorBoundary } from '@/components/shared';
import { useSequenceShortcuts, useShortcuts } from '@/hooks/use-shortcuts';
import { cn } from '@/lib/utils';
import { TransactionModal } from '@/components/features/transactions';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
    openTransactionModal,
    closeTransactionModal,
    selectTransactionModal
} from '@/lib/features/transactions/transactionsSlice';

interface DashboardShellProps {
    children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const { isOpen, editingTransaction } = useAppSelector(selectTransactionModal);

    // Initialize global shortcuts
    useSequenceShortcuts();
    useShortcuts({
        n: () => dispatch(openTransactionModal()),
    });

    // Get page title from pathname
    const getPageTitle = () => {
        const path = pathname?.split('/').pop();
        if (!path || path === 'dashboard') return 'Dashboard';
        return path.charAt(0).toUpperCase() + path.slice(1);
    };

    return (
        <div className="bg-background flex h-screen overflow-hidden">
            <Sidebar onAddExpense={() => dispatch(openTransactionModal())} />
            <div className="flex flex-1 flex-col min-h-0">
                <Header title={getPageTitle()} />
                <main className={cn(
                    "flex-1 overflow-x-hidden scrollbar-hide max-w-[100vw]",
                    pathname === '/transactions'
                        ? "flex flex-col overflow-hidden"
                        : "overflow-y-auto pb-[100px] md:pb-6",
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
            <BottomNav onAddExpense={() => dispatch(openTransactionModal())} />

            <TransactionModal
                open={isOpen}
                onOpenChange={(open) => !open && dispatch(closeTransactionModal())}
                transaction={editingTransaction}
            />
        </div>
    );
}
