import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  type Transition,
  type Variants,
} from 'framer-motion';

export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 360,
  damping: 28,
  mass: 0.8,
};

export const SPRING_SMOOTH: Transition = {
  type: 'spring',
  stiffness: 220,
  damping: 24,
  mass: 0.9,
};

export const EASE_OUT_EXPO: Transition = {
  duration: 1.1,
  ease: [0.16, 1, 0.3, 1],
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.075,
      delayChildren: 0.03,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_SMOOTH,
  },
};

export function isTestEnv(): boolean {
  return typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';
}

/**
 * Smoothly interpolates a numeric metric whenever `value` changes.
 * Renders the final formatted string immediately inside unit tests so assertions never race with animation frames.
 */
export function AnimatedNumber({
  value,
  format = (n) => String(Math.round(n)),
  duration = 1.05,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const skipAnimation = isTestEnv();
  const motionVal = useMotionValue(skipAnimation ? value : 0);
  const [display, setDisplay] = useState<string>(() => format(skipAnimation ? value : 0));
  const formatRef = useRef(format);
  formatRef.current = format;
  const prevValueRef = useRef<number>(skipAnimation ? value : 0);

  useEffect(() => {
    if (skipAnimation) {
      setDisplay(formatRef.current(value));
      prevValueRef.current = value;
      return;
    }

    const from = prevValueRef.current;
    prevValueRef.current = value;
    motionVal.set(from);

    const controls = animate(motionVal, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplay(formatRef.current(latest));
      },
      onComplete: () => {
        setDisplay(formatRef.current(value));
      },
    });

    return () => controls.stop();
  }, [value, duration, skipAnimation, motionVal]);

  return <span className={className}>{skipAnimation ? format(value) : display}</span>;
}

/** Staggered entrance container for KPI strips, card grids, and lists. */
export function StaggerContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  if (isTestEnv()) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Individual child inside a `<StaggerContainer>`. */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  if (isTestEnv()) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}
