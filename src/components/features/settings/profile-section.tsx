'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
// import { UserContextType } from '@/context/auth-context'; // Helper type if needed, or just use any/User

interface ProfileSectionProps {
    user: any; // Ideally typed from AuthContext
    onEdit: () => void;
}

export function ProfileSection({ user, onEdit }: ProfileSectionProps) {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex items-center gap-4 bg-card p-4 rounded-3xl border shadow-sm">
            <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {getInitials(user?.name || 'User')}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <h2 className="font-bold text-lg leading-tight">{user?.name || 'User'}</h2>
                <p className="text-sm text-muted-foreground">{user?.email || 'No email'}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit} className="rounded-full px-4 hover:bg-primary/10 hover:text-primary transition-colors hover:border-primary/50">
                Edit
            </Button>
        </div>
    );
}
