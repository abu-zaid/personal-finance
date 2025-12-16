'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Home,
  ListOrdered,
  Plus,
  BarChart3,
  Wallet,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/use-haptics';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home, id: 'home' },
  { href: '/transactions', label: 'Transactions', icon: ListOrdered, id: 'transactions' },
  { href: null, label: 'Add', icon: Plus, id: 'add', highlight: true },
  { href: '/budgets', label: 'Budgets', icon: Wallet, id: 'budgets' },
  { href: '/insights', label: 'Insights', icon: BarChart3, id: 'insights' },
];

const navItemVariants: Variants = {
  inactive: { scale: 1 },
  active: { scale: 1 },
  tap: { scale: 0.9 },
};

const iconVariants: Variants = {
  inactive: { y: 0 },
  active: { y: -2 },
};

const indicatorVariants: Variants = {
  initial: {
    scale: 0.85,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
  exit: {
    scale: 0.85,
    opacity: 0,
    transition: {
      duration: 0.15,
    },
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
            bg-white/80 dark:bg-[#101010]/80
            backdrop-blur-2xl
            shadow-[0_8px_30px_rgba(0,0,0,0.12)]
            dark:shadow-[0_16px_40px_rgba(0,0,0,0.45)]
            pb-safe
          "
          style={{
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
          {/* Floating Add Button */}
          <motion.button
            onClick={handleAddClick}
            whileTap={{ scale: 0.92 }}
            className="
              absolute
              -top-7
              left-1/2
              -translate-x-1/2
              z-20
              flex
              items-center
              justify-center
            "
          >
            <motion.div
              className="flex items-center justify-center w-14 h-14 rounded-full"
              style={{
                background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
                boxShadow:
                  '0 12px 24px rgba(152,239,90,0.35), 0 6px 12px rgba(0,0,0,0.25)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="h-7 w-7 text-[#101010]" strokeWidth={2.75} />
            </motion.div>
          </motion.button>

          {/* Nav Items */}
          <div className="flex items-center justify-around h-[64px] px-3">
            {navItems.map((item) => {
              if (item.highlight) {
                return <div key={item.id} className="w-10" />;
              }

              const isActive =
                item.href &&
                (pathname === item.href || pathname.startsWith(item.href + '/'));

              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href!}
                  onClick={handleNavClick}
                  className="relative flex flex-col items-center justify-center gap-1 tap-target"
                >
                  <motion.div
                    variants={navItemVariants}
                    initial="inactive"
                    animate={isActive ? 'active' : 'inactive'}
                    whileTap="tap"
                    className="relative flex items-center justify-center w-10 h-10 rounded-xl"
                  >
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="navIndicator"
                          variants={indicatorVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="absolute inset-0 bg-primary/90 rounded-xl"
                        />
                      )}
                    </AnimatePresence>

                    <motion.div
                      variants={iconVariants}
                      animate={isActive ? 'active' : 'inactive'}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="relative z-10"
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 transition-colors duration-200',
                          isActive
                            ? 'text-primary-foreground'
                            : 'text-muted-foreground'
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </motion.div>
                  </motion.div>

                  <motion.span
                    animate={{ opacity: isActive ? 1 : 0.6 }}
                    transition={{ duration: 0.2 }}
                    className="text-[10px] text-muted-foreground"
                  >
                    {item.label}
                  </motion.span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
});
