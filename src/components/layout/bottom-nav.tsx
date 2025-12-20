'use client';

import { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  House,
  ListBullets,
  Plus,
  ChartBar,
  Wallet,
  DotsThreeCircle,
  ArrowsClockwise,
  Flag,
  Gear,
} from 'phosphor-react';

import { useHaptics } from '@/hooks/use-haptics';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const navItems = [
  { href: '/dashboard', icon: House, id: 'home' },
  { href: '/transactions', icon: ListBullets, id: 'transactions' },
  { href: null, icon: Plus, id: 'add', highlight: true },
  { href: '/budgets', icon: Wallet, id: 'budgets' },
  { href: null, icon: DotsThreeCircle, id: 'more' },
];

const secondaryNavItems = [
  { href: '/insights', label: 'Insights', icon: ChartBar },
  { href: '/recurring', label: 'Recurring', icon: ArrowsClockwise },
  { href: '/goals', label: 'Goals', icon: Flag },
  { href: '/settings', label: 'Settings', icon: Gear },
];

interface BottomNavProps {
  onAddExpense?: () => void;
}

export const BottomNav = memo(function BottomNav({
  onAddExpense,
}: BottomNavProps) {
  const pathname = usePathname();
  const haptics = useHaptics();
  const reduceMotion = useReducedMotion();

  const activeId = useMemo(() => {
    return navItems.find(
      (item) =>
        item.href &&
        (pathname === item.href || pathname.startsWith(item.href + '/'))
    )?.id;
  }, [pathname]);

  const handleAddClick = useCallback(() => {
    haptics.medium();
    onAddExpense?.();
  }, [haptics, onAddExpense]);

  const handleNavClick = useCallback(() => {
    haptics.light();
  }, [haptics]);

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 md:hidden pointer-events-none">
      <div className="mx-4 flex justify-center pointer-events-auto">
        <div
          className="
            w-full
            max-w-md
            rounded-[28px]
            bg-white/80 dark:bg-[#101010]/80
            backdrop-blur-md
            shadow-[0_8px_16px_rgba(0,0,0,0.1)]
            overflow-hidden
          "
        >
          {/* static tint layer – cheaper than animating */}
          <div className="pointer-events-none absolute inset-0 bg-white/15 dark:bg-white/[0.04]" />

          <div className="relative flex items-center justify-around h-[72px] px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeId;

              if (item.highlight) {
                return (
                  <motion.button
                    key={item.id}
                    onClick={handleAddClick}
                    whileTap={{ scale: reduceMotion ? 1 : 0.94 }}
                    className="flex items-center justify-center tap-target"
                  >
                    <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#98EF5A] to-[#7BEA3C] shadow-[0_6px_18px_rgba(152,239,90,0.32)] flex items-center justify-center">
                      <Icon size={26} weight="bold" className="text-[#101010]" />
                    </div>
                  </motion.button>
                );
              }

              if (item.id === 'more') {
                return (
                  <Sheet key={item.id}>
                    <SheetTrigger asChild>
                      <motion.button
                        whileTap={{ scale: reduceMotion ? 1 : 0.94 }}
                        onClick={handleNavClick}
                        className="flex items-center justify-center tap-target"
                      >
                        <div className="relative w-12 h-12 rounded-[16px] flex items-center justify-center text-muted-foreground/70">
                          <Icon size={24} />
                        </div>
                      </motion.button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-[32px] p-6 pb-12 dark:bg-[#101010]">
                      <SheetHeader className="mb-6">
                        <SheetTitle className="text-xl font-bold">More Options</SheetTitle>
                      </SheetHeader>
                      <div className="grid grid-cols-2 gap-4">
                        {secondaryNavItems.map((sItem) => (
                          <Link
                            key={sItem.href}
                            href={sItem.href}
                            onClick={handleNavClick}
                            className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-background shadow-sm">
                              <sItem.icon size={22} className="text-foreground" />
                            </div>
                            <span className="text-sm font-semibold">{sItem.label}</span>
                          </Link>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href!}
                  onClick={handleNavClick}
                  className="tap-target"
                >
                  <motion.div
                    whileTap={{ scale: reduceMotion ? 1 : 0.94 }}
                    className="
                      relative
                      w-12 h-12
                      rounded-[16px]
                      flex items-center justify-center
                      transition-colors
                      duration-150
                    "
                  >
                    {/* CSS-only indicator (very fast) */}
                    <div
                      className={`
                        absolute inset-0 rounded-[16px]
                        transition-transform transition-opacity duration-200
                        ${isActive
                          ? 'scale-100 opacity-100 bg-primary'
                          : 'scale-90 opacity-0'
                        }
                      `}
                    />

                    <Icon
                      size={24}
                      weight={isActive ? 'fill' : 'regular'}
                      className={
                        isActive
                          ? 'relative z-10 text-primary-foreground'
                          : 'relative z-10 text-muted-foreground/70'
                      }
                    />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
});
