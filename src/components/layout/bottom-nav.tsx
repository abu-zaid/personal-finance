'use client';

import { memo, useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react'; // Only Plus needed, others in config

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Box, Group, Grid, Stack } from '@/components/ui/layout';
import { NAV_ITEMS, MENU_ITEMS } from '@/config/navigation';

interface BottomNavProps {
  onAddExpense?: () => void;
}

export const BottomNav = memo(function BottomNav({ onAddExpense }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuItemClick = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

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

  const activeId = useMemo(() => {
    const currentPath = pathname === '/' ? '/dashboard' : pathname;
    const menuPaths = ['/insights', '/goals', '/recurring', '/settings'];
    if (menuPaths.some(path => currentPath.startsWith(path))) {
      return 'menu';
    }
    const activeItem = NAV_ITEMS.find((item) =>
      item.href && (currentPath === item.href || currentPath.startsWith(`${item.href}/`))
    );
    return activeItem?.id || 'home';
  }, [pathname]);

  return (
    <Box className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4 md:hidden">
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <Box asChild className="pointer-events-auto">
          <nav>
            <Group
              gap={1}
              className={cn(
                "p-2 rounded-full",
                "bg-card border border-border shadow-lg",
                "shadow-black/5 dark:shadow-black/20",
                "transition-all duration-300 ease-out"
              )}
            >
              {NAV_ITEMS.map((item) => {
                const isActive = item.id === activeId;
                const Icon = item.icon;

                if ('isFab' in item && item.isFab) {
                  return (
                    <Box key={item.id} className="mx-2">
                      <Button
                        onClick={onAddExpense}
                        size="icon"
                        className={cn(
                          "h-12 w-12 rounded-full shadow-md transition-transform hover:scale-105 active:scale-95",
                          "bg-primary text-primary-foreground border-0"
                        )}
                      >
                        <Plus className="h-6 w-6" strokeWidth={2.5} />
                      </Button>
                    </Box>
                  );
                }

                if (item.id === 'menu') {
                  return (
                    <SheetTrigger asChild key={item.id}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "relative h-11 w-11 rounded-full transition-colors duration-200 hover:bg-transparent", // override default ghost hover
                          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {isActive && (
                          <Box
                            asChild
                            className="absolute inset-0 bg-primary/15 rounded-full"
                          >
                            <motion.div
                              layoutId="nav-pill"
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          </Box>
                        )}
                        <Icon size={24} className="relative z-10" />
                      </Button>
                    </SheetTrigger>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href || '#'}
                    passHref
                    legacyBehavior
                  >
                    <Box
                      asChild
                      className={cn(
                        "relative flex items-center justify-center h-11 w-11 rounded-full transition-colors duration-200 cursor-pointer",
                        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <a>
                        {isActive && (
                          <Box
                            asChild
                            className="absolute inset-0 bg-primary/15 rounded-full"
                          >
                            <motion.div
                              layoutId="nav-pill"
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          </Box>
                        )}

                        <Icon
                          size={24}
                          strokeWidth={isActive ? 2.5 : 2}
                          className="relative z-10 transition-transform duration-200"
                          style={{
                            transform: isActive ? 'scale(1)' : 'scale(0.9)'
                          }}
                        />
                      </a>
                    </Box>
                  </Link>
                );
              })}
            </Group>
          </nav>
        </Box>

        <SheetContent side="bottom" className="rounded-t-[2rem] p-6 pb-12 bg-background border-border text-foreground">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">Quick navigation to other sections</SheetDescription>

          <Group justify="center" className="mb-6">
            <Box className="w-12 h-1.5 bg-muted rounded-full" />
          </Group>

          <Grid cols={4} gap={4}>
            {MENU_ITEMS.map((menuItem) => (
              <Link
                key={menuItem.label}
                href={menuItem.href}
                onClick={handleMenuItemClick}
                passHref
                legacyBehavior
              >
                <Stack
                  asChild
                  align="center"
                  gap={3}
                  className="cursor-pointer p-2 rounded-2xl hover:bg-accent transition-colors"
                >
                  <a>
                    <Group
                      align="center"
                      justify="center"
                      className={cn("h-14 w-14 rounded-2xl", menuItem.color)}
                    >
                      <menuItem.icon size={24} />
                    </Group>
                    <span className="text-xs font-medium text-center text-muted-foreground">
                      {menuItem.label}
                    </span>
                  </a>
                </Stack>
              </Link>
            ))}
          </Grid>
        </SheetContent>
      </Sheet>
    </Box >
  );
});
