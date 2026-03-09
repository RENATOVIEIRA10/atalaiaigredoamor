import { motion, HTMLMotionProps, Variants, AnimatePresence, useReducedMotion } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ═══ ANIMATION VARIANTS ═══

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

// ═══ FADE-IN WRAPPER ═══

interface FadeInProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, delay = 0, duration = 0.4, direction = 'up', className, ...props }, ref) => {
    const prefersReduced = useReducedMotion();

    const directionOffset = {
      up: { y: 16 },
      down: { y: -16 },
      left: { x: 16 },
      right: { x: -16 },
      none: {},
    };

    const variants: Variants = {
      hidden: { opacity: 0, ...directionOffset[direction] },
      visible: { 
        opacity: 1, 
        x: 0, 
        y: 0,
        transition: { duration: prefersReduced ? 0 : duration, delay, ease: [0.25, 0.46, 0.45, 0.94] },
      },
    };

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={variants}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
FadeIn.displayName = 'FadeIn';

// ═══ STAGGER CONTAINER ═══

interface StaggerContainerProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
  children: ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
}

export function StaggerContainer({ 
  children, 
  staggerDelay = 0.06, 
  initialDelay = 0.1, 
  className,
  ...props 
}: StaggerContainerProps) {
  const prefersReduced = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReduced ? 0 : staggerDelay,
        delayChildren: prefersReduced ? 0 : initialDelay,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ═══ STAGGER ITEM ═══

interface StaggerItemProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className, ...props }: StaggerItemProps) {
  return (
    <motion.div variants={fadeInUp} className={className} {...props}>
      {children}
    </motion.div>
  );
}

// ═══ CELEBRATION EFFECT (for spiritual milestones) ═══

interface CelebrationGlowProps {
  active?: boolean;
  color?: 'primary' | 'vida' | 'gold' | 'success';
  children: ReactNode;
  className?: string;
}

export function CelebrationGlow({ active = false, color = 'primary', children, className }: CelebrationGlowProps) {
  const colorMap = {
    primary: 'shadow-[0_0_30px_hsl(var(--primary)/0.4)]',
    vida: 'shadow-[0_0_30px_hsl(var(--vida)/0.4)]',
    gold: 'shadow-[0_0_30px_hsl(var(--gold)/0.4)]',
    success: 'shadow-[0_0_30px_hsl(var(--success)/0.4)]',
  };

  return (
    <motion.div
      className={cn('relative', className)}
      animate={active ? { 
        boxShadow: [
          '0 0 0px hsl(var(--primary)/0)',
          colorMap[color].replace('shadow-[', '').replace(']', ''),
          '0 0 0px hsl(var(--primary)/0)',
        ],
      } : {}}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

// ═══ SUCCESS PULSE (for action completion) ═══

interface SuccessPulseProps {
  trigger?: boolean;
  children: ReactNode;
  className?: string;
}

export function SuccessPulse({ trigger = false, children, className }: SuccessPulseProps) {
  return (
    <motion.div
      className={className}
      animate={trigger ? {
        scale: [1, 1.02, 0.98, 1],
        opacity: [1, 0.9, 1, 1],
      } : {}}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// ═══ HOVER LIFT ═══

interface HoverLiftProps extends Omit<HTMLMotionProps<'div'>, 'whileHover' | 'whileTap'> {
  children: ReactNode;
  className?: string;
  lift?: number;
  scale?: number;
}

export function HoverLift({ children, className, lift = 2, scale = 1.01, ...props }: HoverLiftProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      whileHover={prefersReduced ? {} : { y: -lift, scale }}
      whileTap={prefersReduced ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ═══ PAGE TRANSITION WRAPPER ═══

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ═══ SKELETON BREATHE (humanized loading) ═══

export function SkeletonBreathe({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('rounded-xl bg-muted/60', className)}
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// ═══ CARD ENTER ANIMATION ═══

export const cardEnterVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ═══ PRESS ANIMATION WRAPPER ═══

interface PressableProps extends Omit<HTMLMotionProps<'div'>, 'whileTap'> {
  children: ReactNode;
  className?: string;
}

export function Pressable({ children, className, ...props }: PressableProps) {
  return (
    <motion.div
      className={className}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Re-export AnimatePresence for convenience
export { AnimatePresence };
