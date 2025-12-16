'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  House,
  ListBullets,
  Plus,
  ChartBar,
  Wallet,
} from 'phosphor-react';

import { useHaptics } from '@/hooks/use-haptics';

const navItems = [
  { href: '/dashboard', icon: House, id: 'home' },
  { href: '/transactions', icon: ListBullets, id: 'transactions' },
  { href: null, icon: Plus, id: 'add', highlight: true },
  { href: '/budgets', icon: Wallet, id: 'budgets' },
  { href: '/insights', icon: ChartBar, id: 'insights' },
];

const navItemVariants: Variants = {
  inactive: { scale: 1 },
  active: { scale: 1 },
  tap: { scale: 0.92 },
};

const indicatorVariants: Variants = {
  initial: { scale: 0.92, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 420, damping: 28 },
  },
  exit: {
    scale: 0.92,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

interface BottomNavProps {
  onAddExpense?: () => void;
}

export const BottomNav = memo(function BottomNav({ onAddExpense }: BottomNavProps) {
  const pathname = usePathname();
  const haptics = useHaptics();

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
            relative
            w-full
            max-w-md
            rounded-[28px]
            bg-white/55 dark:bg-[#101010]/55
            backdrop-blur-[28px]
            shadow-[0_12px_40px_rgba(0,0,0,0.18)]
            dark:shadow-[0_20px_56px_rgba(0,0,0,0.6)]
            pb-safe
            overflow-hidden
          "
          style={{
            backdropFilter: 'blur(28px) saturate(160%)',
            WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          }}
        >
          {/* subtle iOS tint layer */}
          <div className="pointer-events-none absolute inset-0 bg-white/20 dark:bg-white/[0.04]" />

          <div className="relative flex items-center justify-around h-[72px] px-4 pt-2 pb-3">
            {navItems.map((item) => {
              const isActive =
                item.href &&
                (pathname === item.href || pathname.startsWith(item.href + '/'));

              const Icon = item.icon;

              // Add button (blended, no label)
              if (item.highlight) {
                return (
                  <motion.button
                    key={item.id}
                    onClick={handleAddClick}
                    variants={navItemVariants}
                    initial="inactive"
                    whileTap="tap"
                    className="flex items-center justify-center tap-target"
                  >
                    <div
                      className="
                        flex
                        items-center
                        justify-center
                        w-12
                        h-12
                        rounded-[16px]
                        bg-gradient-to-br
                        from-[#98EF5A]
                        to-[#7BEA3C]
                        shadow-[0_6px_18px_rgba(152,239,90,0.32)]
                      "
                    >
                      <Icon
                        size={26}
                        weight="bold"
                        className="text-[#101010]"
                      />
                    </div>
                  </motion.button>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href!}
                  onClick={handleNavClick}
                  className="flex items-center justify-center tap-target"
                >
                  <motion.div
                    variants={navItemVariants}
                    animate={isActive ? 'active' : 'inactive'}
                    whileTap="tap"
                    className="relative flex items-center justify-center w-12 h-12 rounded-[16px]"
                  >
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="navIndicator"
                          variants={indicatorVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="absolute inset-0 bg-primary rounded-[16px]"
                        />
                      )}
                    </AnimatePresence>

                    <div className="relative z-10">
                      <Icon
                        size={24}
                        weight={isActive ? 'fill' : 'regular'}
                        className={
                          isActive
                            ? 'text-primary-foreground'
                            : 'text-muted-foreground/70'
                        }
                      />
                    </div>
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
