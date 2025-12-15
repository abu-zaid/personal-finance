import { Variants, Easing } from 'framer-motion';
import { ANIMATION_DURATION } from '@/lib/constants';

// Common easing functions
export const easing: Record<string, Easing> = {
  smooth: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  snappy: [0.25, 0.1, 0.25, 1],
};

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.page,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: easing.smooth,
    },
  },
};

// Fade variants
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: ANIMATION_DURATION.normal, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    transition: { duration: ANIMATION_DURATION.fast, ease: easing.smooth },
  },
};

// Scale fade variants
export const scaleFadeVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: easing.smooth,
    },
  },
};

// Slide up variants
export const slideUpVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: easing.smooth,
    },
  },
};

// Stagger container variants
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// Stagger item variants
export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: easing.smooth,
    },
  },
};

// Card hover variants
export const cardHoverVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  },
  hover: {
    scale: 1.01,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: easing.smooth,
    },
  },
  tap: {
    scale: 0.99,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: easing.smooth,
    },
  },
};

// List item variants (for removing items)
export const listItemVariants: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    height: 0,
    marginBottom: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: easing.smooth,
      height: { delay: 0.1 },
      marginBottom: { delay: 0.1 },
    },
  },
};

// Modal/Dialog variants
export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: easing.smooth,
    },
  },
};

// Backdrop variants
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: ANIMATION_DURATION.normal },
  },
  exit: {
    opacity: 0,
    transition: { duration: ANIMATION_DURATION.fast },
  },
};

// Skeleton shimmer variants
export const shimmerVariants: Variants = {
  initial: {
    backgroundPosition: '-200% 0',
  },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear',
    },
  },
};

// Number count up animation config
export const numberSpringConfig = {
  stiffness: 100,
  damping: 30,
  restDelta: 0.001,
};

// Progress bar variants
export const progressVariants: Variants = {
  initial: {
    width: 0,
  },
  animate: (percentage: number) => ({
    width: `${percentage}%`,
    transition: {
      duration: ANIMATION_DURATION.slow,
      ease: easing.smooth,
    },
  }),
};

// Notification/Toast variants
export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    y: -20,
    x: 20,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    x: 50,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: easing.smooth,
    },
  },
};

// Button feedback variants
export const buttonVariants: Variants = {
  initial: { scale: 1 },
  tap: { scale: 0.98 },
  hover: { scale: 1.02 },
};

// Chart animation variants
export const chartBarVariants: Variants = {
  initial: {
    scaleY: 0,
    originY: 1,
  },
  animate: (delay: number) => ({
    scaleY: 1,
    transition: {
      duration: ANIMATION_DURATION.slow,
      ease: easing.smooth,
      delay: delay * 0.1,
    },
  }),
};

// Pie chart segment variants
export const pieSegmentVariants: Variants = {
  initial: {
    pathLength: 0,
    opacity: 0,
  },
  animate: (delay: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 0.8,
        ease: easing.smooth,
        delay: delay * 0.1,
      },
      opacity: {
        duration: 0.3,
        delay: delay * 0.1,
      },
    },
  }),
};
