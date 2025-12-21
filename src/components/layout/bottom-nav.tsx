'use client';

import { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  List,
  Plus,
  Wallet,
  MoreHorizontal,
  TrendingUp,
  Repeat,
  Target,
  Settings,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Navigation configuration
type NavItem = {
  href: string | null;
  icon: typeof Home;
  label: string;
  id: string;
  highlight?: boolean;
};

const navItems: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Home', id: 'home' },
  { href: '/transactions', icon: List, label: 'Transactions', id: 'transactions' },
  { href: null, icon: Plus, label: 'Add', id: 'add', highlight: true },
  { href: '/budgets', icon: Wallet, label: 'Budgets', id: 'budgets' },
  { href: null, icon: MoreHorizontal, label: 'More', id: 'more' },
];

const moreItems = [
  { href: '/insights', label: 'Insights', icon: TrendingUp },
  { href: '/recurring', label: 'Recurring', icon: Repeat },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

interface BottomNavProps {
  onAddExpense?: () => void;
}

// Memoized nav button component for better performance
const NavButton = memo(function NavButton({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  if (item.highlight) {
    return (
      <Button
        onClick={onClick}
        size="icon"
        className={cn(
          "h-14 w-14 rounded-2xl shadow-lg transition-all",
          "bg-gradient-to-br from-[#98EF5A] to-[#7BEA3C]",
          "hover:shadow-xl hover:scale-105",
          "active:scale-95"
        )}
        style={{
          boxShadow: '0 6px 20px rgba(152, 239, 90, 0.35)',
        }}
      >
        <Icon className="h-6 w-6 text-[#101010]" strokeWidth={2.5} />
      </Button>
    );
  }

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
        isActive && "bg-primary"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 transition-colors",
          isActive ? "text-primary-foreground" : "text-muted-foreground"
        )}
        strokeWidth={isActive ? 2.5 : 2}
      />
    </motion.div>
  );
});

export const BottomNav = memo(function BottomNav({
  onAddExpense,
}: BottomNavProps) {
  const pathname = usePathname();

  // Memoize active state calculation
  const activeId = useMemo(() => {
    return navItems.find(
      (item) =>
        item.href &&
        (pathname === item.href || pathname.startsWith(item.href + '/'))
    )?.id;
  }, [pathname]);

  const handleAddClick = useCallback(() => {
    onAddExpense?.();
  }, [onAddExpense]);

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "pb-safe" // Safe area for iOS devices
      )}
    >
      <div className="mx-4 mb-4">
        <div
          className={cn(
            "w-full max-w-md mx-auto",
            "rounded-[28px] overflow-hidden",
            "bg-background/80 backdrop-blur-xl",
            "border border-border/40",
            "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
            "dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          )}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

          <div className="relative flex items-center justify-around h-[72px] px-2">
            {navItems.map((item) => {
              const isActive = item.id === activeId;

              // Add button
              if (item.highlight) {
                return (
                  <NavButton
                    key={item.id}
                    item={item}
                    isActive={false}
                    onClick={handleAddClick}
                  />
                );
              }

              // More button with sheet
              if (item.id === 'more') {
                return (
                  <Sheet key={item.id}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-2xl"
                      >
                        <NavButton item={item} isActive={false} />
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="bottom"
                      className={cn(
                        "rounded-t-[32px] p-6 pb-12",
                        "border-t border-border/40"
                      )}
                    >
                      <SheetHeader className="mb-6">
                        <SheetTitle className="text-xl font-bold">
                          More Options
                        </SheetTitle>
                      </SheetHeader>
                      <div className="grid grid-cols-2 gap-3">
                        {moreItems.map((moreItem) => {
                          const MoreIcon = moreItem.icon;
                          const isMoreActive = pathname === moreItem.href || pathname.startsWith(moreItem.href + '/');

                          return (
                            <SheetClose asChild key={moreItem.href}>
                              <Link href={moreItem.href}>
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    "w-full h-auto flex flex-col items-center gap-3 p-4 rounded-2xl",
                                    "hover:bg-muted/50 transition-colors",
                                    isMoreActive && "bg-primary/10 text-primary"
                                  )}
                                >
                                  <div className={cn(
                                    "h-12 w-12 flex items-center justify-center rounded-xl",
                                    "bg-background shadow-sm border border-border/40",
                                    isMoreActive && "bg-primary/20 border-primary/20"
                                  )}>
                                    <MoreIcon className="h-5 w-5" strokeWidth={2} />
                                  </div>
                                  <span className="text-sm font-semibold">
                                    {moreItem.label}
                                  </span>
                                </Button>
                              </Link>
                            </SheetClose>
                          );
                        })}
                      </div>
                    </SheetContent>
                  </Sheet>
                );
              }

              // Regular nav items
              return (
                <Link
                  key={item.id}
                  href={item.href!}
                  className="tap-target"
                >
                  <NavButton item={item} isActive={isActive} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
});
