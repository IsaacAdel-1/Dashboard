// Shared Tailwind class strings so buttons and inputs look the same everywhere.
const buttonBase =
    "inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium h-9 px-3 whitespace-nowrap transition-colors disabled:opacity-50";

export const btn = {
    primary: `${buttonBase} bg-accent text-accent-ink hover:brightness-110`,
    secondary: `${buttonBase} border border-line bg-surface text-ink hover:bg-hover`,
    ghost: `${buttonBase} text-ink-2 hover:bg-hover hover:text-ink`,
    danger: `${buttonBase} border border-line bg-surface text-critical-ink hover:bg-hover`,
    icon: "inline-flex items-center justify-center size-8 rounded-lg text-ink-2 hover:bg-hover hover:text-ink transition-colors disabled:opacity-40",
};

export const inputClass =
    "h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted outline-none focus:border-accent";

export const cellInputClass =
    "h-8 w-full min-w-0 rounded-md border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-accent";

export const thClass = "px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted whitespace-nowrap";
export const tdClass = "px-4 py-3 text-sm text-ink whitespace-nowrap";
