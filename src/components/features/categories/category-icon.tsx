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
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function CategoryIcon({ icon, color, size = 'md', className }: CategoryIconProps) {
  const Icon = iconMap[icon] || MoreHorizontal;

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: `${color}20` }}
    >
      <Icon
        className={cn(iconSizeClasses[size])}
        style={{ color }}
      />
    </div>
  );
}
