import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { INVOICE_STATUS_COLORS, PROJECT_STATUS_COLORS } from "../../utils/constants";

// A pill with a colored dot (identity) and the status in normal text color,
// so the meaning never depends on color alone.
export default function StatusBadge({ label, color, icon: Icon }) {
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-ink"
            style={{ backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)` }}
        >
            {Icon ? (
                <Icon size={13} style={{ color }} aria-hidden="true" />
            ) : (
                <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
            )}
            {label}
        </span>
    );
}

export function ProjectStatusBadge({ status }) {
    if (!status) return <span className="text-muted">—</span>;
    return <StatusBadge label={status} color={PROJECT_STATUS_COLORS[status] ?? "var(--muted)"} />;
}

const INVOICE_ICONS = { Paid: CheckCircle2, Pending: Clock, Overdue: AlertCircle };

export function InvoiceStatusBadge({ status }) {
    return <StatusBadge label={status} color={INVOICE_STATUS_COLORS[status]} icon={INVOICE_ICONS[status]} />;
}
