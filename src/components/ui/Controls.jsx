import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search, X } from "lucide-react";
import { btn, thClass } from "./styles";

export function SearchInput({ value, onChange, placeholder = "Search", className = "" }) {
    return (
        <label className={`flex h-9 min-w-0 items-center gap-2 rounded-lg border border-line bg-surface px-3 focus-within:border-accent ${className}`}>
            <Search size={16} className="shrink-0 text-muted" aria-hidden="true" />
            <input
                type="search"
                className="w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label={placeholder}
            />
            {value && (
                <button type="button" onClick={() => onChange("")} className="text-muted hover:text-ink" aria-label="Clear search">
                    <X size={14} />
                </button>
            )}
        </label>
    );
}

// Tabs like: All 411 · Pending 4 · In Progress 2 ...
export function FilterTabs({ options, value, onChange }) {
    return (
        <div className="flex flex-wrap gap-1.5" role="tablist">
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(option.value)}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors ${
                            active ? "border-ink bg-ink text-surface" : "border-line bg-surface text-ink-2 hover:bg-hover"
                        }`}
                    >
                        {option.color && (
                            <span className="size-2 rounded-full" style={{ backgroundColor: option.color }} aria-hidden="true" />
                        )}
                        {option.label}
                        {option.count !== undefined && (
                            <span className={`tabular text-xs ${active ? "opacity-70" : "text-muted"}`}>{option.count}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export function SortHeader({ label, sortKey, sort, onSort, align = "left", className = "" }) {
    const active = sort.key === sortKey;
    const Icon = !active ? ChevronsUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
    return (
        <th className={`${thClass} ${className}`} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                className={`inline-flex items-center gap-1 uppercase hover:text-ink ${align === "right" ? "flex-row-reverse" : ""} ${active ? "text-ink" : ""}`}
            >
                {label}
                <Icon size={12} aria-hidden="true" className={active ? "" : "opacity-50"} />
            </button>
        </th>
    );
}

export function Pagination({ page, pageCount, total, pageSize, onPageChange, noun = "rows" }) {
    if (total === 0) return null;
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-ink-2">
            <span className="tabular">
                {from}–{to} of {total} {noun}
            </span>
            <div className="flex items-center gap-1">
                <button type="button" className={btn.icon} onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
                    <ChevronLeft size={16} />
                </button>
                <span className="tabular px-2">
                    Page {page} of {pageCount}
                </span>
                <button type="button" className={btn.icon} onClick={() => onPageChange(page + 1)} disabled={page >= pageCount} aria-label="Next page">
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

export function Avatar({ initials, size = 40, className = "" }) {
    return (
        <div
            className={`flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent ${className}`}
            style={{ width: size, height: size, fontSize: size * 0.36 }}
            aria-hidden="true"
        >
            {initials}
        </div>
    );
}

// Progress toward a goal. The track is a lighter step of the same hue.
export function Meter({ value, max, label }) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div
            className="h-2 w-full overflow-hidden rounded-full bg-accent-soft"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-label={label}
        >
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
    );
}

export function Field({ label, htmlFor, hint, error, children }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
                {label}
            </label>
            {children}
            {error ? <p className="text-xs text-critical-ink">{error}</p> : hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
    );
}
