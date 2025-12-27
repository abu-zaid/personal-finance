'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NAV_ITEMS, MENU_ITEMS } from '@/config/navigation';
import { Wallet, Plus, ChevronLeft, ChevronRight, User } from 'lucide-react';

interface SideNavProps {
    onAdd?: () => void;
}

export function SideNav({ onAdd }: SideNavProps) {
    const pathname = usePathname();

    // Collapsed state with localStorage persistence
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebar-collapsed');
            if (saved) setIsCollapsed(saved === 'true');
        }
    }, []);

    // Toggle collapse
    const toggleCollapse = useCallback(() => {
        setIsCollapsed(prev => {
            const newValue = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem('sidebar-collapsed', String(newValue));
            }
            return newValue;
        });
    }, []);

    // Keyboard shortcut (Ctrl+B)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                toggleCollapse();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleCollapse]);

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 80 : 256 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
                "hidden md:flex flex-col fixed inset-y-0 z-50",
                "bg-card/50 backdrop-blur-xl border-r border-border/50"
            )}
        >
            <div className="flex flex-col h-full py-6 px-4 gap-6">
                {/* Header with Logo and Toggle */}
                <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between", "px-2")}>
                    {!isCollapsed ? (
                        <>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                                    <Wallet size={24} />
                                </div>
                                <span className="font-bold text-xl tracking-tight">Finance</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleCollapse}
                                className="h-8 w-8 rounded-lg hover:bg-accent/50"
                            >
                                <ChevronLeft size={18} />
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleCollapse}
                            className="h-8 w-8 rounded-lg hover:bg-accent/50"
                        >
                            <ChevronRight size={18} />
                        </Button>
                    )}
                </div>

                {/* Add Transaction Button */}
                {!isCollapsed ? (
                    <Button
                        onClick={onAdd}
                        className="w-full shadow-md hover:shadow-lg transition-shadow"
                        size="lg"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Add Transaction
                    </Button>
                ) : (
                    <Button
                        onClick={onAdd}
                        size="icon"
                        className="h-12 w-12 rounded-full shadow-md hover:shadow-lg transition-shadow mx-auto"
                        title="Add Transaction"
                    >
                        <Plus size={22} />
                    </Button>
                )}

                {/* Main Navigation */}
                <nav className="flex-1 space-y-1">
                    {NAV_ITEMS.filter(item => !('isFab' in item && item.isFab) && item.id !== 'menu').map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const Icon = item.icon;

                        return (
                            <Button
                                key={item.id}
                                asChild
                                variant="ghost"
                                className={cn(
                                    "w-full h-12 transition-all duration-200 relative",
                                    isCollapsed ? "justify-center px-0" : "justify-start px-4",
                                    isActive
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:translate-x-1"
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <Link href={item.href || '#'}>
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidenav-active"
                                            className="absolute inset-0 bg-primary/10 rounded-xl"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}
                                    <Icon
                                        size={20}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className="relative z-10"
                                    />
                                    {!isCollapsed && (
                                        <span className="relative z-10 ml-3 font-medium">
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            </Button>
                        );
                    })}

                    {/* Divider */}
                    <div className="my-4 h-px bg-border/50" />

                    {/* Secondary Items */}
                    {MENU_ITEMS.filter(item => item.label !== 'Settings').map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const Icon = item.icon;

                        return (
                            <Button
                                key={item.label}
                                asChild
                                variant="ghost"
                                className={cn(
                                    "w-full h-10 transition-all duration-200 relative",
                                    isCollapsed ? "justify-center px-0" : "justify-start px-4",
                                    isActive
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:translate-x-1"
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <Link href={item.href}>
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidenav-active"
                                            className="absolute inset-0 bg-primary/10 rounded-xl"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}
                                    <Icon
                                        size={18}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className="relative z-10"
                                    />
                                    {!isCollapsed && (
                                        <span className="relative z-10 ml-3 text-sm">
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            </Button>
                        );
                    })}
                </nav>

                {/* Footer - Settings & User */}
                <div className="space-y-2 border-t border-border/50 pt-4">
                    {/* Settings */}
                    {MENU_ITEMS.filter(i => i.label === 'Settings').map(item => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const Icon = item.icon;

                        return (
                            <Button
                                key={item.label}
                                asChild
                                variant="ghost"
                                className={cn(
                                    "w-full h-10 transition-all duration-200 relative",
                                    isCollapsed ? "justify-center px-0" : "justify-start px-4",
                                    isActive
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <Link href={item.href}>
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidenav-active"
                                            className="absolute inset-0 bg-primary/10 rounded-xl"
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}
                                    <Icon size={18} className="relative z-10" />
                                    {!isCollapsed && (
                                        <span className="relative z-10 ml-3 text-sm">
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            </Button>
                        );
                    })}

                    {/* User Profile */}
                    {!isCollapsed ? (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <User size={18} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">User</p>
                                <p className="text-xs text-muted-foreground truncate">View Profile</p>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto cursor-pointer hover:bg-primary/30 transition-colors"
                            title="User Profile"
                        >
                            <User size={20} className="text-primary" />
                        </div>
                    )}
                </div>
            </div>
        </motion.aside>
    );
}
