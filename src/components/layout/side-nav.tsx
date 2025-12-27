'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Box, Stack, Group } from '@/components/ui/layout';
import { NAV_ITEMS, MENU_ITEMS } from '@/config/navigation';
import { Wallet, Plus } from 'lucide-react'; // Logo Icon

interface SideNavProps {
    onAdd?: () => void;
}

export function SideNav({ onAdd }: SideNavProps) {
    const pathname = usePathname();

    return (
        <Box
            className={cn(
                "hidden md:flex w-64 flex-col fixed inset-y-0 z-50",
                "bg-card border-r border-border"
            )}
        >
            <Stack className="h-full py-6 px-4" gap={6}>
                {/* Logo */}
                <Group className="px-2" gap={3}>
                    <Box className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-primary-foreground">
                        <Wallet size={24} />
                    </Box>
                    <span className="font-bold text-xl tracking-tight">Finance</span>
                </Group>

                {/* Add Button */}
                <Button onClick={onAdd} className="w-full shadow-md" size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Add Transaction
                </Button>

                {/* Main Nav */}
                <Stack className="flex-1" gap={2} asChild>
                    <nav>
                        {NAV_ITEMS.filter(item => !('isFab' in item && item.isFab) && item.id !== 'menu').map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                            const Icon = item.icon;

                            return (
                                <Button
                                    key={item.id}
                                    asChild
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start h-12 text-base font-medium",
                                        isActive ? "bg-accent/50 text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Link href={item.href || '#'}>
                                        <Icon className="mr-3 h-5 w-5" />
                                        {item.label}
                                        {isActive && (
                                            <Box
                                                asChild
                                                className="ml-auto w-1 h-1 rounded-full bg-primary"
                                            >
                                                <motion.div layoutId="sidenav-indicator" />
                                            </Box>
                                        )}
                                    </Link>
                                </Button>
                            )
                        })}

                        <Box className="my-2 h-px bg-border/50" />

                        {/* Secondary/Menu Items */}
                        {MENU_ITEMS.map((item) => {
                            if (item.label === 'Settings') return null; // Handle settings separately at bottom
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                            return (
                                <Button
                                    key={item.label}
                                    asChild
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start h-10 text-sm",
                                        isActive ? "bg-accent/50 text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Link href={item.href}>
                                        {/* Using smaller icons or standard */}
                                        <item.icon className="mr-3 h-4 w-4" />
                                        {item.label}
                                    </Link>
                                </Button>
                            );
                        })}


                    </nav>
                </Stack>

                {/* Bottom Section (User/Settings) */}
                <Stack gap={2}>
                    {MENU_ITEMS.filter(i => i.label === 'Settings').map(item => (
                        <Button key={item.label} asChild variant="ghost" className="w-full justify-start">
                            <Link href={item.href}>
                                <item.icon className="mr-3 h-4 w-4" />
                                {item.label}
                            </Link>
                        </Button>
                    ))}
                </Stack>
            </Stack>
        </Box>
    );
}
