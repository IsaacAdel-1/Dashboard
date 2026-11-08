import { CheckCircle2 } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { daysBetween, formatDate, todayISO } from "../../utils/dataHelpers";
import { SortHeader } from "../ui/Controls";
import { InvoiceStatusBadge } from "../ui/StatusBadge";
import { btn, tdClass, thClass } from "../ui/styles";

const COLUMNS = [
    { key: "number", label: "Invoice" },
    { key: "client", label: "Client" },
    { key: "service", label: "Service" },
    { key: "issueDate", label: "Issued" },
    { key: "dueDate", label: "Due" },
    { key: "total", label: "Total", align: "right" },
    { key: "status", label: "Status" },
];

function dueNote(invoice, today) {
    if (invoice.status === "Paid") return invoice.paidDate ? `Paid ${formatDate(invoice.paidDate)}` : null;
    const days = daysBetween(today, invoice.dueDate);
    if (days < 0) return `${-days} days late`;
    if (days === 0) return "Due today";
    return `In ${days} days`;
}

// The invoices table. Sorting state comes from the page (useTable).
export default function Invoices({ invoices, sort, onSort, onMarkPaid }) {
    const { money } = useApp();
    const today = todayISO();

    return (
        <table className="w-full min-w-[920px] border-collapse">
            <thead>
                <tr className="border-b border-line bg-surface-2">
                    {COLUMNS.map((c) => (
                        <SortHeader
                            key={c.key}
                            label={c.label}
                            sortKey={c.key}
                            sort={sort}
                            onSort={onSort}
                            align={c.align}
                            className={c.align === "right" ? "text-right" : ""}
                        />
                    ))}
                    <th className={thClass}>
                        <span className="sr-only">Actions</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {invoices.map((inv) => {
                    const note = dueNote(inv, today);
                    return (
                        <tr key={inv.id} className="border-b border-line last:border-0 hover:bg-hover">
                            <td className={`${tdClass} tabular font-medium`}>{inv.number}</td>
                            <td className={tdClass}>{inv.client}</td>
                            <td className={`${tdClass} text-ink-2`}>{inv.service}</td>
                            <td className={`${tdClass} tabular text-ink-2`}>{formatDate(inv.issueDate)}</td>
                            <td className={`${tdClass} tabular`}>
                                <span className="text-ink-2">{formatDate(inv.dueDate)}</span>
                                {note && (
                                    <span className={`block text-xs ${inv.status === "Overdue" ? "text-critical-ink" : "text-muted"}`}>{note}</span>
                                )}
                            </td>
                            <td className={`${tdClass} tabular text-right`}>
                                {money(inv.total)}
                                <span className="block text-xs text-muted">incl. {money(inv.tax)} tax</span>
                            </td>
                            <td className={tdClass}>
                                <InvoiceStatusBadge status={inv.status} />
                            </td>
                            <td className={`${tdClass} text-right`}>
                                {inv.status !== "Paid" && (
                                    <button type="button" className={`${btn.ghost} h-8`} onClick={() => onMarkPaid(inv)}>
                                        <CheckCircle2 size={15} /> Mark paid
                                    </button>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
