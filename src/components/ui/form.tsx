import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const control =
  "w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-accent/60 focus:outline-none focus-visible:outline-2 focus-visible:outline-accent/60 aria-[invalid=true]:border-rose-400/60";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(control, "h-9", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(control, "min-h-24 leading-relaxed", className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return <select ref={ref} className={cn(control, "h-9 appearance-auto pr-8", className)} {...props} />;
});

export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
  count,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  count?: { value: number; max: number };
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
          {required && <span className="ml-0.5 text-fg-subtle" aria-hidden>*</span>}
        </label>
        {count && (
          <span className={cn("text-xs tabular-nums", count.value > count.max ? "text-rose-300" : "text-fg-subtle")}>
            {count.value}/{count.max}
          </span>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-fg-subtle">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Toggleable chip used for multi-select filters and skill pickers. */
export function Chip({
  selected,
  onToggle,
  children,
  className,
}: {
  selected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "rounded-md border px-2.5 py-1 text-[13px] transition-colors",
        selected
          ? "border-accent/50 bg-accent-soft text-accent"
          : "border-line-strong bg-surface text-fg-muted hover:border-[#38404a] hover:text-fg",
        className,
      )}
    >
      {children}
    </button>
  );
}
