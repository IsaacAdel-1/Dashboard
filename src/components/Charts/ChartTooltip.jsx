// Custom tooltip used by every chart so they all look the same.
// Recharts passes { active, payload, label }; each payload item is one series.
export default function ChartTooltip({ active, payload, label, formatter = (v) => v }) {
    if (!active || !payload?.length) return null;
    const title = payload[0]?.payload?.fullLabel ?? label;

    return (
        <div className="min-w-[160px] rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-lg">
            {title && <p className="mb-1.5 text-xs text-muted">{title}</p>}
            <div className="flex flex-col gap-1">
                {payload.map((item) => (
                    <div key={item.dataKey ?? item.name} className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2 text-ink-2">
                            <span
                                className="size-2 shrink-0 rounded-full"
                                style={{ backgroundColor: item.payload?.color ?? item.color ?? item.fill }}
                                aria-hidden="true"
                            />
                            {item.name}
                        </span>
                        <span className="tabular font-medium text-ink">{formatter(item.value, item)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
