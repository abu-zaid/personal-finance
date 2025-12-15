'use client';

import Link from 'next/link';
import { LogOut, Settings, User, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { APP_NAME } from '@/lib/constants';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header 
      className="z-40 flex h-16 flex-shrink-0 items-center justify-between px-4 lg:px-6 bg-white/90 dark:bg-[#101010]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/[0.06]"
    >
      <div className="flex items-center gap-3">
        {/* Mobile Logo */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <div 
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
              boxShadow: '0 0 12px rgba(152, 239, 90, 0.25)',
            }}
          >
            <Wallet className="text-[#101010] h-4.5 w-4.5" />
          </div>
          <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
        </div>
        {/* Desktop Title */}
        {title && <h1 className="hidden text-xl font-semibold tracking-tight lg:block">{title}</h1>}
      </div>

      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-xl p-0">
              <Avatar className="h-9 w-9 border-2 border-white/10">
                <AvatarImage src="/avatar.png" alt={user?.name || 'User'} />
                <AvatarFallback className="bg-white/[0.06] text-foreground text-sm">
                  {user?.name ? getInitials(user.name) : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'Guest'}</p>
                <p className="text-muted-foreground/70 text-xs leading-none">
                  {user?.email || 'guest@example.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
