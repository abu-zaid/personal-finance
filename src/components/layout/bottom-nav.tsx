'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  ListOrdered,
  Plus,
  BarChart3,
  User,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home, id: 'home' },
  { href: '/transactions', label: 'Transactions', icon: ListOrdered, id: 'transactions' },
  { href: null, label: 'Add', icon: Plus, id: 'add', highlight: true },
  { href: '/insights', label: 'Insights', icon: BarChart3, id: 'insights' },
  { href: '/settings', label: 'Profile', icon: User, id: 'profile' },
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

export function BottomNav({ onAddExpense }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Translucent glass background */}
      <div className="bg-[#101010]/80 backdrop-blur-2xl border-t border-white/10 pb-safe">
        <div className="flex items-center justify-around h-[76px] px-4">
          {navItems.map((item, index) => {
            const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + '/') : false;
            const Icon = item.icon;

            // Add button - styled like other buttons but with primary color
            if (item.highlight) {
              return (
                <motion.button
                  key={item.id}
                  onClick={onAddExpense}
                  variants={navItemVariants}
                  initial="inactive"
                  whileTap="tap"
                  className="relative flex flex-col items-center justify-center gap-1 tap-target"
                >
                  <motion.div
                    className="flex items-center justify-center w-11 h-11 rounded-2xl bg-primary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
                  </motion.div>
                  <span className="text-[10px] font-medium text-primary">
                    {item.label}
                  </span>
                </motion.button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href!}
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
}
