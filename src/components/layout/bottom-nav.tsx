'use client';

import { memo, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  BarChart2,
  Plus,
  List,
  Settings,
  Wallet,
  Target,
  Repeat,
  LayoutGrid,
  Tags,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// Navigation configuration
const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Home', id: 'home' },
  { href: '/transactions', icon: List, label: 'Activity', id: 'transactions' },
  { href: null, icon: Plus, label: 'Add', id: 'add', isFab: true },
  { href: '/budgets', icon: Wallet, label: 'Budgets', id: 'budgets' },
  { href: null, icon: LayoutGrid, label: 'Menu', id: 'menu' },
] as const;

interface BottomNavProps {
  onAddExpense?: () => void;
}

export const BottomNav = memo(function BottomNav({ onAddExpense }: BottomNavProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Determine active tab
  const activeId = useMemo(() => {
    // Exact match or sub-path match (except for root/dashboard which needs special handling if aliases exist)
    const currentPath = pathname === '/' ? '/dashboard' : pathname;

    // Find the item that matches the current path
    const activeItem = NAV_ITEMS.find((item) =>
      item.href && (currentPath === item.href || currentPath.startsWith(`${item.href}/`))
    );

    return activeItem?.id || 'home';
  }, [pathname]);

  return (
    <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4 md:hidden">
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <nav className="pointer-events-auto">
          <div
            className={cn(
              "flex items-center gap-1 p-1.5 rounded-full",
              "bg-background/80 backdrop-blur-xl border border-border",
              "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] shadow-black/10",
              "transition-all duration-300 ease-out"
            )}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === activeId;
              const Icon = item.icon;

              // Render FAB (Add Button)
              if ('isFab' in item && item.isFab) {
                return (
                  <div key={item.id} className="mx-2">
                    <Button
                      onClick={onAddExpense}
                      size="icon"
                      className={cn(
                        "h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95",
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                        "shadow-primary/25"
                      )}
                    >
                      <Plus className="h-6 w-6" strokeWidth={2.5} />
                    </Button>
                  </div>
                );
              }

              // Render Menu Trigger
              if (item.id === 'menu') {
                return (
                  <SheetTrigger asChild key={item.id}>
                    <button
                      className="relative"
                    >
                      <div
                        className={cn(
                          "relative flex items-center justify-center h-11 w-11 rounded-full transition-colors duration-200",
                          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {/* Active Background Pill (if menu was somehow active route) */}
                        {isActive && (
                          <motion.div
                            layoutId="nav-pill"
                            className="absolute inset-0 bg-primary/10 rounded-full"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <Icon size={24} className="relative z-10" />
                      </div>
                    </button>
                  </SheetTrigger>
                );
              }

              // Render Nav Links
              return (
                <Link
                  key={item.id}
                  href={item.href || '#'}
                  className="relative"
                >
                  <div
                    className={cn(
                      "relative flex items-center justify-center h-11 w-11 rounded-full transition-colors duration-200",
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {/* Active Background Pill */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-primary/10 rounded-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}

                    {/* Icon */}
                    <Icon
                      size={24}
                      strokeWidth={isActive ? 2.5 : 2}
                      className="relative z-10 transition-transform duration-200"
                      style={{
                        transform: isActive ? 'scale(1)' : 'scale(0.9)'
                      }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        <SheetContent side="bottom" className="rounded-t-[2rem] p-6 pb-12 bg-background border-border text-foreground">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-1.5 bg-muted rounded-full" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Insights', icon: BarChart2, href: '/insights', color: 'bg-blue-500/20 text-blue-500' },
              { label: 'Goals', icon: Target, href: '/goals', color: 'bg-emerald-500/20 text-emerald-500' },
              { label: 'Recurring', icon: Repeat, href: '/recurring', color: 'bg-purple-500/20 text-purple-500' },
              { label: 'Categories', icon: Tags, href: '/settings/categories', color: 'bg-pink-500/20 text-pink-500' },
              { label: 'Settings', icon: Settings, href: '/settings', color: 'bg-muted text-foreground' },
            ].map((menuItem) => (
              <Link
                key={menuItem.label}
                href={menuItem.href}
                onClick={() => setIsMenuOpen(false)}
                className="flex flex-col items-center gap-3 p-2 rounded-2xl hover:bg-accent transition-colors"
              >
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", menuItem.color)}>
                  <menuItem.icon size={24} />
                </div>
                <span className="text-xs font-medium text-center text-muted-foreground">{menuItem.label}</span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div >
  );
});
