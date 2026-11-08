import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

/**
 * A KPI tile: label, big value and an optional change vs the previous period.
 * delta:     number or null (null = nothing to compare with)
 * deltaUnit: "%" for relative change, "pts" for percentage-point change
 * upIsGood:  false for things like expenses or overdue amounts
 */
export default function StatTile({ icon: Icon, label, value, delta, deltaUnit = "%", upIsGood = true, comparison, hint }) {
    let deltaNode = null;
    if (delta !== undefined) {
        if (delta === null || !Number.isFinite(delta)) {
            deltaNode = <span className="text-muted">No data for previous period</span>;
        } else {
            const rounded = Math.round(delta * 10) / 10;
            const flat = Math.abs(rounded) < 0.5;
            const good = flat ? null : rounded > 0 === upIsGood;
            const DeltaIcon = flat ? Minus : rounded > 0 ? ArrowUpRight : ArrowDownRight;
            const color = good === null ? "text-muted" : good ? "text-good-ink" : "text-critical-ink";
            const sign = rounded > 0 ? "+" : "";
            const amount = deltaUnit === "pts" ? `${sign}${rounded.toFixed(1)} pts` : `${sign}${Math.round(rounded)}%`;
            deltaNode = (
                <>
                    <span className={`inline-flex items-center gap-0.5 font-medium ${color}`}>
                        <DeltaIcon size={14} aria-hidden="true" />
                        {amount}
                    </span>
                    {comparison && <span className="text-muted">{comparison}</span>}
                </>
            );
        }
    }

    return (
        <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-line bg-surface px-5 py-4 shadow-[var(--shadow)]">
            <div className="flex items-center gap-2 text-[13px] text-ink-2">
                {Icon && <Icon size={16} className="text-muted" aria-hidden="true" />}
                {label}
            </div>
            <div className="truncate text-[26px] leading-tight font-semibold text-ink">{value}</div>
            {deltaNode && <div className="flex flex-wrap items-center gap-x-1.5 text-[13px]">{deltaNode}</div>}
            {hint && <div className="text-[13px] text-muted">{hint}</div>}
        </div>
    );
}
