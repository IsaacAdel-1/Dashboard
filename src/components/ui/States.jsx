import { CloudOff, Inbox, RefreshCw } from "lucide-react";
import { btn } from "./styles";

export function LoadingState({ label = "Loading…" }) {
    return (
        <div className="flex min-h-[240px] items-center justify-center gap-3 text-sm text-muted" role="status">
            <span className="size-4 animate-spin rounded-full border-2 border-line border-t-accent" aria-hidden="true" />
            {label}
        </div>
    );
}

export function ErrorState({ message, onRetry }) {
    return (
        <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center">
            <CloudOff size={28} className="text-muted" aria-hidden="true" />
            <div>
                <p className="font-medium text-ink">Couldn't load data</p>
                <p className="mt-1 max-w-md text-sm text-muted">{message}</p>
            </div>
            <code className="rounded-md bg-surface-2 px-2 py-1 text-xs text-ink-2">npm run server</code>
            {onRetry && (
                <button type="button" className={btn.secondary} onClick={onRetry}>
                    <RefreshCw size={14} /> Try again
                </button>
            )}
        </div>
    );
}

export function EmptyState({ title = "Nothing here yet", message, action }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <Inbox size={26} className="text-muted" aria-hidden="true" />
            <p className="font-medium text-ink">{title}</p>
            {message && <p className="max-w-sm text-sm text-muted">{message}</p>}
            {action}
        </div>
    );
}
