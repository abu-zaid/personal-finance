import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DataProviders } from '@/components/providers/data-providers';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { HydrateStore } from '@/components/providers/hydrate-store';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch categories server-side for global hydration
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  const categories = (categoriesData || []).map((c) => ({
    id: c.id,
    userId: c.user_id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    isDefault: c.is_default,
    order: c.sort_order,
    createdAt: c.created_at,
    updatedAt: c.updated_at
  }));

  return (
    <DataProviders>
      <HydrateStore categories={categories} />
      <DashboardShell>
        {children}
      </DashboardShell>
    </DataProviders>
  );
}
