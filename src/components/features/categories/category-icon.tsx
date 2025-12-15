'use client';

import { cn } from '@/lib/utils';
import {
  UtensilsCrossed,
  Car,
  Home,
  Zap,
  Film,
  ShoppingBag,
  Heart,
  GraduationCap,
  MoreHorizontal,
  Plane,
  Shirt,
  Dumbbell,
  Coffee,
  Gift,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'utensils-crossed': UtensilsCrossed,
  car: Car,
  home: Home,
  zap: Zap,
  film: Film,
  'shopping-bag': ShoppingBag,
  heart: Heart,
  'graduation-cap': GraduationCap,
  'more-horizontal': MoreHorizontal,
  plane: Plane,
  shirt: Shirt,
  dumbbell: Dumbbell,
  coffee: Coffee,
  gift: Gift,
  'credit-card': CreditCard,
};

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showGlow?: boolean;
}

const sizeClasses = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
};

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function CategoryIcon({ icon, color, size = 'md', className, showGlow = false }: CategoryIconProps) {
  const Icon = iconMap[icon] || MoreHorizontal;

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl transition-all duration-200',
        sizeClasses[size],
        className
      )}
      style={{ 
        backgroundColor: `${color}15`,
        border: `1.5px solid ${color}30`,
        boxShadow: showGlow ? `0 0 12px ${color}20` : undefined,
      }}
    >
      <Icon
        className={cn(iconSizeClasses[size], 'transition-transform duration-200')}
        style={{ color }}
      />
    </div>
  );
}
