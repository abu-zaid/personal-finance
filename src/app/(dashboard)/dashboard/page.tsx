import { redirect } from 'next/navigation';
import { getDashboardData } from '@/lib/api/dashboard';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
    const data = await getDashboardData();

    if (!data) {
        redirect('/login');
    }

    return <DashboardClient data={data} />;
}
