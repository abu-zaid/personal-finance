'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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

interface BottomNavProps {
  onAddExpense?: () => void;
}

export function BottomNav({ onAddExpense }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Glass background */}
      <div className="bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="flex items-center justify-around h-[72px] pb-safe px-2">
          {navItems.map((item) => {
            const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + '/') : false;
            const Icon = item.icon;

            // Special "Add" button in the center
            if (item.highlight) {
              return (
                <button
                  key={item.id}
                  onClick={onAddExpense}
                  className="relative -mt-6"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-[0_8px_24px_rgba(152,239,90,0.4)]"
                  >
                    <Icon className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
                  </motion.div>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href!}
                className="relative flex flex-col items-center justify-center gap-1 tap-target"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200',
                    isActive && 'bg-primary'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors duration-200',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </motion.div>
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
