import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getDashboardData } from '@/lib/api/dashboard';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

export default async function DashboardPage() {
    const data = await getDashboardData();

    if (!data) {
        redirect('/login');
    }

    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardClient data={data} />
        </Suspense>
    );
}
