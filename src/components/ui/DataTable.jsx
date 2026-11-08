import { thClass } from "./styles";

// A plain read-only table. Used as the "table view" of every chart.
// columns: [{ key, label, align: "left" | "right", format: (value, row) => node }]
export default function DataTable({ columns, rows, maxHeight = 300 }) {
    return (
        <div className="overflow-auto rounded-lg border border-line" style={{ maxHeight }}>
            <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-surface-2">
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} className={`${thClass} ${col.align === "right" ? "text-right" : ""}`}>
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={row.id ?? row.label ?? row.name ?? i} className="border-t border-line">
                            {columns.map((col) => (
                                <td
                                    key={col.key}
                                    className={`px-4 py-2 text-ink whitespace-nowrap ${col.align === "right" ? "tabular text-right" : ""}`}
                                >
                                    {col.format ? col.format(row[col.key], row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
