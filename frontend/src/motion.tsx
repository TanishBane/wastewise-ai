import {
  type HTMLMotionProps,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { motionTokens, type RevealDirection } from "./motionTokens";

export interface ScrollRevealProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  direction?: RevealDirection;
  distance?: number;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  threshold?: number;
}

/**
 * Reusable scroll-reveal container.
 * Smoothly reveals content when entering the viewport.
 * Automatically respects prefers-reduced-motion.
 */
export function ScrollReveal({
  children,
  direction = "up",
  distance = motionTokens.distance.standard,
  delay = 0,
  duration = motionTokens.duration.reveal,
  className = "",
  once = true,
  threshold = 0.15,
  ...props
}: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  const getInitial = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: distance };
      case "down":
        return { opacity: 0, y: -distance };
      case "left":
        return { opacity: 0, x: distance };
      case "right":
        return { opacity: 0, x: -distance };
      case "scale":
        return { opacity: 0, scale: 0.97 };
      case "fade":
      default:
        return { opacity: 0 };
    }
  };

  const getAnimate = () => {
    switch (direction) {
      case "up":
      case "down":
        return { opacity: 1, y: 0 };
      case "left":
      case "right":
        return { opacity: 1, x: 0 };
      case "scale":
        return { opacity: 1, scale: 1 };
      case "fade":
      default:
        return { opacity: 1 };
    }
  };

  return (
    <motion.div
      initial={getInitial()}
      whileInView={getAnimate()}
      viewport={{ once, amount: threshold }}
      transition={{
        duration,
        delay,
        ease: motionTokens.ease.out,
      }}
      className={className}
      {...(props as HTMLMotionProps<"div">)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container for grouped cards/steps/stats.
 */
export function StaggerGroup({
  children,
  staggerDelay = 0.08,
  delayChildren = 0.05,
  className = "",
  once = true,
  ...props
}: {
  children: ReactNode;
  staggerDelay?: number;
  delayChildren?: number;
  className?: string;
  once?: boolean;
} & ComponentPropsWithoutRef<"div">) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.1 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }}
      className={className}
      {...(props as HTMLMotionProps<"div">)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Child item inside a StaggerGroup.
 */
export function StaggerItem({
  children,
  distance = motionTokens.distance.standard,
  duration = motionTokens.duration.reveal,
  className = "",
  ...props
}: {
  children: ReactNode;
  distance?: number;
  duration?: number;
  className?: string;
} & ComponentPropsWithoutRef<"div">) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: distance },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration,
            ease: motionTokens.ease.out,
          },
        },
      }}
      className={className}
      {...(props as HTMLMotionProps<"div">)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Smooth KPI Counter for numerical dashboard values with loading skeleton transition.
 *
 * Phase A: While loading, displays a subtle, dimensionally stable shimmer skeleton placeholder.
 * Phase B: When real API data arrives, smoothly transitions the skeleton into a refined count-up animation
 * settling precisely at the exact value.
 * Fully accessible and instant under prefers-reduced-motion.
 */
export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 0.75,
  loading = false,
  className = "",
}: {
  value?: number | null;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  loading?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const shouldReduceMotion = useReducedMotion();

  // If value is null/undefined or loading is true, we are in loading state
  const isDataLoading =
    loading || value === null || value === undefined || Number.isNaN(value);

  // Track the previous resolved value to only animate on genuine changes
  const prevValueRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef<boolean>(false);

  const getInitialStart = (val: number | null | undefined): number => {
    if (val == null || Number.isNaN(val)) return 0;
    if (val <= 0) return 0;
    return Math.max(1, Math.floor(val * 0.25));
  };

  const [displayValue, setDisplayValue] = useState<number>(() =>
    getInitialStart(value),
  );

  useEffect(() => {
    // If still loading or not yet in view, do nothing
    if (isDataLoading || !isInView) return;

    const targetVal = value as number;

    // Reduced motion: skip animation entirely
    if (shouldReduceMotion) {
      prevValueRef.current = targetVal;
      hasAnimatedRef.current = true;
      return;
    }

    // Check if we already rendered this exact value
    if (hasAnimatedRef.current && prevValueRef.current === targetVal) {
      return;
    }

    const startVal =
      prevValueRef.current !== null
        ? prevValueRef.current
        : targetVal > 0
          ? Math.max(1, Math.floor(targetVal * 0.25))
          : 0;
    const durMs = Math.max(450, Math.min(duration * 1000, 900));
    let startTime: number | null = null;
    let animationFrame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durMs, 1);

      // Smooth cubic-out deceleration
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (targetVal - startVal) * ease;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetVal);
        prevValueRef.current = targetVal;
        hasAnimatedRef.current = true;
      }
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, isDataLoading, duration, shouldReduceMotion, isInView]);

  // Loading state placeholder (dimensionally stable skeleton)
  if (isDataLoading) {
    return (
      <span
        ref={ref}
        className={`animated-counter is-loading ${className}`}
        aria-busy="true"
        aria-label="Loading metric…"
      >
        <span className="animated-counter-shimmer" aria-hidden="true" />
      </span>
    );
  }

  // Active numeric value
  const numToFormat = shouldReduceMotion ? (value ?? 0) : displayValue;

  // Format with INR locale when prefix is ₹ or standard locale
  const formatted =
    prefix === "₹"
      ? decimals > 0
        ? numToFormat.toLocaleString("en-IN", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : Math.round(numToFormat).toLocaleString("en-IN")
      : decimals > 0
        ? numToFormat.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : Math.round(numToFormat).toLocaleString();

  return (
    <span ref={ref} className={`animated-counter is-revealed ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/**
 * Route page transition wrapper for brief, dignified view switches.
 */
export function PageTransition({
  children,
  pageKey,
}: {
  children: ReactNode;
  pageKey: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className="page-transition-wrapper">{children}</div>;
  }

  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: motionTokens.duration.route,
        ease: motionTokens.ease.out,
      }}
      className="page-transition-wrapper"
    >
      {children}
    </motion.div>
  );
}

/**
 * Subtle reading progress bar for long-form explanatory views.
 */
export function ReadingProgressBar() {
  const { scrollYProgress } = useScroll();
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <motion.div
      className="reading-progress-bar"
      style={{
        scaleX: scrollYProgress,
        transformOrigin: "0% 50%",
      }}
      aria-hidden="true"
    />
  );
}
