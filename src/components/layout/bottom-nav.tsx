'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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

const navItemVariants = {
  inactive: { scale: 1 },
  active: { scale: 1 },
  tap: { scale: 0.9 },
};

const iconVariants = {
  inactive: { y: 0 },
  active: { y: -2 },
};

const indicatorVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1, 
    transition: { type: 'spring' as const, stiffness: 500, damping: 30 } 
  },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.15 } },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Translucent glass background with theme support */}
      <div 
        className="pb-safe bg-white/90 dark:bg-[#101010]/85 backdrop-blur-2xl border-t border-gray-200/50 dark:border-white/[0.08] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.3)]"
        style={{
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        <div className="flex items-center justify-around h-[72px] px-4">
          {navItems.map((item, index) => {
            const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + '/') : false;
            const Icon = item.icon;

            // Add button - styled with gradient and glow
            if (item.highlight) {
              return (
                <motion.button
                  key={item.id}
                  onClick={handleAddClick}
                  variants={navItemVariants}
                  initial="inactive"
                  whileTap="tap"
                  className="relative flex flex-col items-center justify-center gap-1 tap-target"
                >
                  <motion.div
                    className="flex items-center justify-center w-12 h-12 rounded-2xl"
                    style={{
                      background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
                      boxShadow: '0 0 20px rgba(152, 239, 90, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)',
                    }}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 24px rgba(152, 239, 90, 0.4), 0 6px 16px rgba(0, 0, 0, 0.25)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="h-6 w-6 text-[#101010]" strokeWidth={2.5} />
                  </motion.div>
                </motion.button>
              );
            }

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
                  className="relative flex items-center justify-center w-11 h-11 rounded-2xl"
                >
                  {/* Active background indicator */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        variants={indicatorVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0 bg-primary rounded-2xl"
                        layoutId="navIndicator"
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
                        isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </motion.div>
                </motion.div>
                <motion.span
                  animate={{
                    color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                    fontWeight: isActive ? 500 : 400,
                  }}
                  transition={{ duration: 0.2 }}
                  className="text-[10px]"
                >
                  {item.label}
                </motion.span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
});
