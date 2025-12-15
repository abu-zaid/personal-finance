'use client';

import { Inbox, FileQuestion, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EmptyStateVariant = 'default' | 'no-results' | 'error';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultIcons: Record<EmptyStateVariant, React.ReactNode> = {
  default: <Inbox className="h-12 w-12" />,
  'no-results': <FileQuestion className="h-12 w-12" />,
  error: <AlertCircle className="h-12 w-12" />,
};

export function EmptyState({
  variant = 'default',
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 py-12 text-center',
        className
      )}
    >
      <div
        className={cn(
          'text-muted-foreground mb-4',
          variant === 'error' && 'text-destructive'
        )}
      >
        {icon || defaultIcons[variant]}
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4 max-w-sm text-sm">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant={variant === 'error' ? 'outline' : 'default'}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
