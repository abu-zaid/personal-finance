'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import {
  pageVariants,
  fadeVariants,
  slideUpVariants,
  staggerItemVariants,
} from '@/lib/animations';

interface AnimationWrapperProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

// Page transition wrapper
export function PageTransition({ children, className, delay }: AnimationWrapperProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={delay ? { delay } : undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Fade in wrapper
export function FadeIn({ children, className, delay }: AnimationWrapperProps) {
  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={delay ? { delay } : undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Slide up wrapper
export function SlideUp({ children, className }: AnimationWrapperProps) {
  return (
    <motion.div
      variants={slideUpVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps extends AnimationWrapperProps {
  staggerDelay?: number;
}

// Stagger container for list animations - Optimized
export function StaggerContainer({ children, className, staggerDelay }: StaggerContainerProps) {
  return (
    <motion.div
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay ?? 0.03, // Faster stagger for better feel
            delayChildren: 0.05,
          },
        },
      }}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger item for use inside StaggerContainer
export function StaggerItem({ children, className }: AnimationWrapperProps) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// Animate presence wrapper for conditional rendering
interface AnimatePresenceWrapperProps {
  children: ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
}

export function AnimatePresenceWrapper({ children, mode = 'wait' }: AnimatePresenceWrapperProps) {
  return <AnimatePresence mode={mode}>{children}</AnimatePresence>;
}

// Lazy mount wrapper - only animates when coming into view
interface LazyAnimationProps extends AnimationWrapperProps {
  once?: boolean;
  threshold?: number;
}

export function LazyAnimation({
  children,
  className,
  once = true,
  threshold = 0.2,
}: LazyAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: threshold }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Export motion components for direct use
export { motion, AnimatePresence };
