/**
 * Lifecycle Stage: UI Motion System -> Isolated GPU Spring & Magnetic Micro-Physics Primitives
 * Production Invariant (🔴): Magnetic tracking uses MotionValues outside React state; perpetual pulses are memo-isolated.
 * Trap Prevented (⚠️): Calling useState on mousemove or unmemoized infinite loops causing parent layout re-renders.
 */
import { motion, useMotionValue, useSpring, type HTMLMotionProps } from "framer-motion";
import { memo, useRef, type MouseEvent, type ReactNode } from "react";

export const SPRING_TACTILE = {
  type: "spring" as const,
  stiffness: 320,
  damping: 26,
  mass: 0.7,
};

export const SPRING_DRAWER = {
  type: "spring" as const,
  stiffness: 290,
  damping: 30,
  mass: 0.85,
};

export const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.02,
    },
  },
};

export const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 24,
    },
  },
};

interface MagneticButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  strength?: number;
}

export function MagneticButton({
  children,
  strength = 0.16,
  className = "",
  onMouseMove,
  onMouseLeave,
  ...rest
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 220, damping: 18, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 220, damping: 18, mass: 0.4 });

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      rawX.set(dx * strength);
      rawY.set(dy * strength);
    }
    onMouseMove?.(e);
  };

  const handleMouseLeave = (e: MouseEvent<HTMLButtonElement>) => {
    rawX.set(0);
    rawY.set(0);
    onMouseLeave?.(e);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x, y }}
      whileTap={{ scale: 0.98 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export const LivePulseDot = memo(function LivePulseDot({
  tone = "emerald",
}: {
  tone?: "emerald" | "rose" | "amber";
}) {
  const colorMap = {
    emerald: { ring: "bg-emerald-500/40", core: "bg-emerald-500" },
    rose: { ring: "bg-rose-500/40", core: "bg-rose-500" },
    amber: { ring: "bg-amber-500/40", core: "bg-amber-500" },
  };
  const colors = colorMap[tone];

  return (
    <span className="relative inline-flex h-2 w-2 shrink-0 items-center justify-center" aria-hidden="true">
      <motion.span
        className={`absolute inline-flex h-full w-full rounded-full ${colors.ring}`}
        animate={{ scale: [1, 2.15, 1], opacity: [0.65, 0, 0.65] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${colors.core}`} />
    </span>
  );
});

const AVATAR_TONES = [
  "bg-zinc-900 text-zinc-50 border-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-300",
  "bg-emerald-950 text-emerald-200 border-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40",
  "bg-zinc-200 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
  "bg-stone-800 text-stone-100 border-stone-700 dark:bg-zinc-800 dark:text-emerald-300 dark:border-zinc-700",
];

export function MonogramAvatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: "xs" | "sm" | "md";
}) {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();

  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % AVATAR_TONES.length;
  }
  const tone = AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];

  const sizeClass =
    size === "xs"
      ? "h-5 w-5 text-[9px]"
      : size === "md"
        ? "h-8 w-8 text-[11px]"
        : "h-6 w-6 text-[10px]";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md border font-mono font-semibold tracking-tight ${sizeClass} ${tone}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
