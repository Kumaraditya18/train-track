import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary: "glass-btn-primary hover:bg-white/55",
  secondary:
    "glass border border-line-strong text-fg shadow-[var(--shadow-glass)] hover:bg-white/65",
  ghost: "text-muted hover:bg-white/45 hover:text-fg",
  danger: "border border-transparent bg-danger text-accent-ink shadow-sm hover:bg-danger/90",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export function Button({ variant = "primary", className = "", children, ...rest }: Props) {
  return (
    <button
      type="button"
      className={`btn type-cta inline-flex cursor-pointer items-center justify-center rounded-2xl px-4 py-2.5 transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-[var(--m-out)] [transition-timing-function:var(--m-ease)] hover:duration-[var(--m-in)] disabled:cursor-not-allowed disabled:opacity-45 ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
