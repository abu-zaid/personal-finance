import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/types';

interface DashboardHeaderProps {
    user: User | null;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
    return (
        <div className="flex items-center justify-between py-4 px-2">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-sm font-medium text-muted-foreground">Welcome back,</h1>
                    <p className="text-lg font-bold text-foreground leading-none">{user?.name?.split(' ')[0]}</p>
                </div>
            </div>
        </div>
    );
}
