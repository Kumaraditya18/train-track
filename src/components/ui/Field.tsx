import type { InputHTMLAttributes, ReactNode } from "react";

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="type-body-strong mb-1.5 block text-soft">
      {children}
    </label>
  );
}

const fieldClass =
  "glass glass-read w-full min-w-0 rounded-xl border border-line-strong px-3.5 py-2.5 text-base text-fg placeholder:text-faint outline-none transition-[border-color,box-shadow] duration-200 [transition-timing-function:var(--ease-out)] focus:border-line-strong focus:ring-2 focus:ring-white/80";

function mergeFieldClass(extra?: string) {
  return extra ? `${fieldClass} ${extra}` : fieldClass;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={mergeFieldClass(className)}
      suppressHydrationWarning
    />
  );
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={mergeFieldClass(className)}
      suppressHydrationWarning
    />
  );
}
