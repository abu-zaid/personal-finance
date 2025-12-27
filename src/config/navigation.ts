import {
    Home,
    BarChart2,
    Plus,
    List,
    Settings,
    Wallet,
    Target,
    Repeat,
    LayoutGrid,
    Tags,
} from 'lucide-react';

export const NAV_ITEMS = [
    { href: '/dashboard', icon: Home, label: 'Home', id: 'home' },
    { href: '/transactions', icon: List, label: 'Activity', id: 'transactions' },
    { href: null, icon: Plus, label: 'Add', id: 'add', isFab: true },
    { href: '/budgets', icon: Wallet, label: 'Budgets', id: 'budgets' },
    { href: null, icon: LayoutGrid, label: 'Menu', id: 'menu' },
] as const;

export const MENU_ITEMS = [
    { label: 'Insights', icon: BarChart2, href: '/insights', color: 'bg-blue-500/20 text-blue-500' },
    { label: 'Goals', icon: Target, href: '/goals', color: 'bg-emerald-500/20 text-emerald-500' },
    { label: 'Recurring', icon: Repeat, href: '/recurring', color: 'bg-purple-500/20 text-purple-500' },
    { label: 'Categories', icon: Tags, href: '/settings/categories', color: 'bg-pink-500/20 text-pink-500' },
    { label: 'Settings', icon: Settings, href: '/settings', color: 'bg-muted text-foreground' },
] as const;
