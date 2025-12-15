'use client';

import { motion } from 'framer-motion';
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
  default: <Inbox className="h-10 w-10" />,
  'no-results': <FileQuestion className="h-10 w-10" />,
  error: <AlertCircle className="h-10 w-10" />,
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center px-6 py-10 text-center',
        className
      )}
    >
      <div
        className={cn(
          'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl',
          'bg-muted/50 dark:bg-white/[0.05]',
          variant === 'error' ? 'text-destructive' : 'text-muted-foreground'
        )}
      >
        {icon || defaultIcons[variant]}
      </div>
      <h3 className="mb-1.5 text-base font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground/80 mb-5 max-w-[280px] text-sm leading-relaxed">{description}</p>
      )}
      {action && (
        <Button 
          onClick={action.onClick} 
          variant={variant === 'error' ? 'outline' : 'default'}
          size="sm"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
