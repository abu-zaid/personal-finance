'use client';

import { usePathname } from 'next/navigation';
import { SideNav } from '@/components/layout/side-nav';
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
import { Box, Stack } from '@/components/ui/layout';

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

    const getPageTitle = () => {
        const path = pathname?.split('/').pop();
        if (!path || path === 'dashboard') return 'Dashboard';
        return path.charAt(0).toUpperCase() + path.slice(1);
    };

    return (
        <Box className="bg-background flex h-screen overflow-hidden">
            {/* Desktop Sidebar */}
            <SideNav onAdd={() => dispatch(openTransactionModal())} />

            {/* Main Content Area */}
            <Stack className="flex-1 min-w-0 md:ml-64 transition-[margin] duration-300 ease-in-out">
                {/* Header (Optional: Keep it for title/profile on mobile/desktop) */}
                <Box asChild>
                    <Header title={getPageTitle()} />
                </Box>

                <Box
                    asChild
                    className={cn(
                        "flex-1 overflow-x-hidden scrollbar-hide max-w-[100vw]",
                        // Adjust padding for bottom nav on mobile
                        pathname === '/transactions'
                            ? "flex flex-col overflow-y-auto"
                            : "overflow-y-auto pb-[100px] md:pb-6",
                        "will-change-contents"
                    )}
                    style={{ contentVisibility: 'auto' }}
                >
                    <main>
                        <ErrorBoundary>
                            {pathname === '/transactions' ? (
                                children
                            ) : (
                                <Box className="container mx-auto p-4 md:p-6 max-w-7xl">
                                    {children}
                                </Box>
                            )}
                        </ErrorBoundary>
                    </main>
                </Box>
            </Stack>

            {/* Mobile Bottom Navigation */}
            <BottomNav onAddExpense={() => dispatch(openTransactionModal())} />

            <TransactionModal
                open={isOpen}
                onOpenChange={(open) => !open && dispatch(closeTransactionModal())}
                transaction={editingTransaction}
            />
        </Box>
    );
}
