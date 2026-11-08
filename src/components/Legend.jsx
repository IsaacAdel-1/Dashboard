// Legend as a list: swatch · name · value · share of total.
// items: [{ name, value, color }]
export default function Legend({ items, valueFormatter = (v) => v }) {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    return (
        <ul className="flex flex-col gap-2">
            {items.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-ink-2">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
                        <span className="truncate">{item.name}</span>
                    </span>
                    <span className="tabular shrink-0 text-ink">
                        {valueFormatter(item.value)}
                        <span className="ml-2 inline-block w-10 text-right text-muted">
                            {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                        </span>
                    </span>
                </li>
            ))}
        </ul>
    );
}

// A one-row legend for multi-series charts: ● Revenue  ● Expenses
export function InlineLegend({ items }) {
    return (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
            {items.map((item) => (
                <li key={item.label} className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
                    {item.label}
                </li>
            ))}
        </ul>
    );
}
