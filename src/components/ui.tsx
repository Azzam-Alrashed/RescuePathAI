import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "danger" | "success" | "info" | "outline" | "header";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand-navy text-white hover:bg-brand-navy/90 dark:bg-white dark:text-brand-navy dark:hover:bg-slate-200",
  danger: "bg-red-600 text-white shadow-lg shadow-red-600/25 hover:bg-red-700",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  info: "bg-blue-600 text-white hover:bg-blue-700",
  outline:
    "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
  header: "border border-white/15 text-white hover:bg-white/10",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-13 gap-2.5 rounded-2xl px-5 text-base",
};

const ICON_SIZE: Record<Size, number> = { sm: 14, md: 16, lg: 20 };

export function buttonClass(variant: Variant = "outline", size: Size = "md") {
  return `inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 ${VARIANT[variant]} ${SIZE[size]}`;
}

export function Button({
  variant = "outline",
  size = "md",
  icon: Icon,
  mirrorIcon,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  /** Flip a directional icon (arrows, send) in right-to-left layouts. */
  mirrorIcon?: boolean;
}) {
  return (
    <button type="button" className={`${buttonClass(variant, size)} ${className}`} {...props}>
      {Icon && (
        <Icon
          size={ICON_SIZE[size]}
          strokeWidth={2.2}
          className={mirrorIcon ? "rtl:-scale-x-100" : undefined}
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}

/** Small uppercase-style section heading with an icon. */
export function SectionTitle({
  icon: Icon,
  children,
  aside,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
        {Icon && <Icon size={16} strokeWidth={2.2} className="text-slate-400" aria-hidden />}
        {children}
      </h3>
      {aside}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {children}
    </section>
  );
}

type Tone = "neutral" | "amber" | "sky" | "green" | "orange" | "blue" | "red";

const TONE: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  amber: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  sky: "bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-300",
  green: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300",
  orange: "bg-orange-100 text-orange-900 dark:bg-orange-500/15 dark:text-orange-300",
  blue: "bg-blue-100 text-blue-900 dark:bg-blue-500/15 dark:text-blue-300",
  red: "bg-red-100 text-red-900 dark:bg-red-500/15 dark:text-red-300",
};

export function Chip({
  tone = "neutral",
  icon: Icon,
  spin,
  children,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  spin?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TONE[tone]}`}>
      {Icon && <Icon size={12} strokeWidth={2.4} className={spin ? "animate-spin" : undefined} aria-hidden />}
      {children}
    </span>
  );
}
