'use client';

import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useAuth();

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
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center justify-between px-4",
        "bg-background/80 backdrop-blur-xl",
        "border-b border-border/50",
        "md:hidden" // Hide on desktop (side nav provides context)
      )}
    >
      {/* Page Title */}
      <h1 className="text-xl font-bold tracking-tight">
        {title || 'Dashboard'}
      </h1>

      {/* User Avatar */}
      <button
        className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-accent/50 transition-colors"
        aria-label="User profile"
      >
        <Avatar className="h-9 w-9 border-2 border-primary/20">
          <AvatarImage src="/avatar.png" alt={user?.name || 'User'} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {user?.name ? getInitials(user.name) : <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
      </button>
    </header>
  );
}
