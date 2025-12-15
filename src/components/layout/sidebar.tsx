'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  ListOrdered,
  BarChart3,
  Settings,
  Plus,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/budgets', label: 'Budgets', icon: Wallet },
  { href: '/transactions', label: 'Transactions', icon: ListOrdered },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  onAddExpense?: () => void;
}

export function Sidebar({ onAddExpense }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar border-sidebar-border hidden h-screen w-64 flex-col border-r lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl">
          <Wallet className="text-primary-foreground h-5 w-5" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">{APP_NAME}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Quick Add Button */}
      <div className="border-t border-sidebar-border p-4">
        <Button onClick={onAddExpense} className="w-full gap-2" size="lg">
          <Plus className="h-5 w-5" />
          Add Expense
        </Button>
      </div>
    </aside>
  );
}
