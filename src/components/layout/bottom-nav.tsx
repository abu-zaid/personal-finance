'use client';

import { memo, useMemo, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { NAV_ITEMS, MENU_ITEMS } from '@/config/navigation';

interface BottomNavProps {
  onAddExpense?: () => void;
}

// Memoized nav item component
const NavItem = memo(({
  item,
  isActive,
  onClick,
  isMenuTrigger = false
}: {
  item: any;
  isActive: boolean;
  onClick?: () => void;
  isMenuTrigger?: boolean;
}) => {
  const Icon = item.icon;

  const handleClick = useCallback(() => {
    // Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick?.();
  }, [onClick]);

  const content = (
    <>
      {/* Active indicator */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute inset-0 bg-primary/10 rounded-2xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <motion.div
        className="relative z-10"
        animate={{
          scale: isActive ? 1.1 : 0.9,
          y: isActive ? -2 : 0,
        }}
        transition={{ duration: 0.2 }}
      >
        <Icon
          size={24}
          strokeWidth={isActive ? 2.5 : 2}
        />
      </motion.div>
    </>
  );

  const className = cn(
    "relative flex items-center justify-center flex-1 py-3 px-3 rounded-2xl transition-all duration-200",
    "active:scale-95",
    isActive ? "text-primary" : "text-muted-foreground"
  );

  if (isMenuTrigger) {
    return (
      <button onClick={handleClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={item.href || '#'} onClick={handleClick} className={className}>
      {content}
    </Link>
  );
});

NavItem.displayName = 'NavItem';

// FAB Component
const FAB = memo(({ onClick }: { onClick?: () => void }) => {
  const handleClick = useCallback(() => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
    onClick?.();
  }, [onClick]);

  return (
    <motion.button
      onClick={handleClick}
      className={cn(
        "relative flex items-center justify-center",
        "h-12 w-12 rounded-full",
        "bg-primary text-primary-foreground",
        "shadow-lg shadow-primary/25",
        "transition-transform duration-200"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Plus size={26} strokeWidth={2.5} />
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg -z-10" />
    </motion.button>
  );
});

FAB.displayName = 'FAB';

export const BottomNav = memo(function BottomNav({ onAddExpense }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Prefetch routes
  useEffect(() => {
    NAV_ITEMS.forEach(item => {
      if (item.href) router.prefetch(item.href);
    });

    const timer = setTimeout(() => {
      MENU_ITEMS.forEach(item => {
        router.prefetch(item.href);
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleMenuItemClick = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // Determine active item
  const activeId = useMemo(() => {
    const currentPath = pathname === '/' ? '/dashboard' : pathname;
    const menuPaths = ['/insights', '/goals', '/recurring', '/settings'];

    if (menuPaths.some(path => currentPath.startsWith(path))) {
      return 'menu';
    }

    const activeItem = NAV_ITEMS.find(item =>
      item.href && (currentPath === item.href || currentPath.startsWith(`${item.href}/`))
    );

    return activeItem?.id || 'home';
  }, [pathname]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe"
      style={{ contain: 'layout style paint' }}
    >
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        {/* Glassmorphism container */}
        <div className={cn(
          "mx-4 mb-4 px-3 py-2.5",
          "bg-background/80 backdrop-blur-xl",
          "border border-border/50",
          "rounded-3xl shadow-2xl"
        )}>
          <div className="flex items-center justify-between gap-2 relative">
            {NAV_ITEMS.map((item, index) => {
              const isActive = item.id === activeId;

              // FAB in the middle
              if ('isFab' in item && item.isFab) {
                return (
                  <div key={item.id} className="flex justify-center px-2">
                    <FAB onClick={onAddExpense} />
                  </div>
                );
              }

              // Menu trigger
              if (item.id === 'menu') {
                return (
                  <SheetTrigger asChild key={item.id}>
                    <div className="flex-1">
                      <NavItem
                        item={item}
                        isActive={isActive}
                        isMenuTrigger={true}
                      />
                    </div>
                  </SheetTrigger>
                );
              }

              // Regular nav items
              return (
                <div key={item.id} className="flex-1">
                  <NavItem item={item} isActive={isActive} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Menu Sheet */}
        <SheetContent
          side="bottom"
          className="rounded-t-3xl p-6 pb-12 bg-background/95 backdrop-blur-xl border-border/50"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">Quick navigation to other sections</SheetDescription>

          {/* Handle */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-1.5 bg-muted rounded-full" />
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-4 gap-4">
            {MENU_ITEMS.map((menuItem) => (
              <Link
                key={menuItem.label}
                href={menuItem.href}
                onClick={handleMenuItemClick}
                className="flex flex-col items-center gap-3 p-3 rounded-2xl hover:bg-accent/50 transition-colors active:scale-95"
              >
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", menuItem.color)}>
                  <menuItem.icon size={24} />
                </div>
                <span className="text-xs font-medium text-center text-muted-foreground">
                  {menuItem.label}
                </span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
});
