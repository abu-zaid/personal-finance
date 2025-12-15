'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useInView } from 'framer-motion';
import { numberSpringConfig } from '@/lib/animations';
import { useCurrency } from '@/hooks/use-currency';

interface AnimatedNumberProps {
  value: number;
  format?: 'number' | 'currency' | 'percentage';
  className?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  format = 'number',
  className,
  duration = 0.8,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    ...numberSpringConfig,
    duration: duration * 1000,
  });
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        let displayValue: string;

        switch (format) {
          case 'currency':
            displayValue = formatCurrency(latest);
            break;
          case 'percentage':
            displayValue = `${Math.round(latest)}%`;
            break;
          default:
            displayValue = Math.round(latest).toLocaleString();
        }

        ref.current.textContent = displayValue;
      }
    });

    return unsubscribe;
  }, [springValue, format, formatCurrency]);

  return <span ref={ref} className={className} />;
}

interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  overBudgetColor?: string;
}

export function AnimatedProgress({
  value,
  max = 100,
  className,
  barClassName,
  showLabel = false,
  overBudgetColor = 'bg-destructive',
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const isOverBudget = value > max;
  const displayPercentage = isOverBudget ? 100 : percentage;

  return (
    <div className={className}>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <motion.div
          className={`h-full rounded-full ${isOverBudget ? overBudgetColor : barClassName || 'bg-primary'}`}
          initial={{ width: 0 }}
          animate={{ width: `${displayPercentage}%` }}
          transition={{
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex justify-between text-xs">
          <span className={isOverBudget ? 'text-destructive font-medium' : 'text-muted-foreground'}>
            {Math.round(percentage)}%
          </span>
          {isOverBudget && <span className="text-destructive font-medium">Over budget</span>}
        </div>
      )}
    </div>
  );
}

interface PulseIndicatorProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PulseIndicator({ color = 'bg-green-500', size = 'md', className }: PulseIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <span className={`relative inline-flex ${className}`}>
      <motion.span
        className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-75`}
        animate={{ scale: [1, 1.5, 1.5], opacity: [0.75, 0, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
      />
      <span className={`relative inline-flex rounded-full ${color} ${sizeClasses[size]}`} />
    </span>
  );
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <svg className="h-full w-full" viewBox="0 0 24 24" fill="none">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </motion.div>
  );
}

interface CheckmarkAnimationProps {
  show: boolean;
  size?: number;
  className?: string;
}

export function CheckmarkAnimation({ show, size = 24, className }: CheckmarkAnimationProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      initial={false}
      className={className}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={show ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.path
        d="M7 13l3 3 7-7"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={show ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      />
    </motion.svg>
  );
}
