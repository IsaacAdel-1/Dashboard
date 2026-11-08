import { useMemo, useState } from "react";
import { AlertCircle, Clock, Download, Plus, Timer, Wallet } from "lucide-react";
import BarChart from "../components/Charts/BarCharts";
import InvoicesTable from "../components/Invoices/Invoices";
import { InlineLegend } from "../components/Legend";
import ChartCard from "../components/ui/ChartCard";
import { Field, FilterTabs, Pagination, SearchInput } from "../components/ui/Controls";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import StatTile from "../components/ui/StatTile";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { btn, inputClass } from "../components/ui/styles";
import { useApp } from "../contexts/AppContext";
import { useInvoicesSearching } from "../hooks/useInvoicesSearching";
import useTable from "../hooks/useTable";
import { INVOICE_STATUSES, INVOICE_STATUS_COLORS } from "../utils/constants";
import {
    addDays,
    buildTimeSeries,
    daysBetween,
    downloadCSV,
    formatDate,
    isInRange,
    makeBuckets,
    parseDate,
    percentChange,
    sum,
    toISODate,
    todayISO,
} from "../utils/dataHelpers";

const PAYMENT_METHODS = ["Bank Transfer", "InstaPay", "Credit Card", "Cash"];

function MarkPaidModal({ invoice, onClose, onConfirm }) {
    const { money } = useApp();
    const [paidDate, setPaidDate] = useState(todayISO());
    const [method, setMethod] = useState(PAYMENT_METHODS[0]);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        try {
            await onConfirm(invoice, { paidDate, method });
            onClose();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Modal
            title={`Mark ${invoice.number} as paid`}
            description={`${invoice.client} · ${money(invoice.total)}`}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className={btn.secondary} onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" form="mark-paid-form" className={btn.primary}>
                        Mark as paid
                    </button>
                </>
            }
        >
            <form id="mark-paid-form" onSubmit={submit} className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <Field label="Payment date" htmlFor="paid-date">
                    <input id="paid-date" type="date" className={inputClass} value={paidDate} max={todayISO()} onChange={(e) => setPaidDate(e.target.value)} required />
                </Field>
                <Field label="Method" htmlFor="paid-method">
                    <select id="paid-method" className={inputClass} value={method} onChange={(e) => setMethod(e.target.value)}>
                        {PAYMENT_METHODS.map((m) => (
                            <option key={m}>{m}</option>
                        ))}
                    </select>
                </Field>
                {error && <p className="col-span-full text-sm text-critical-ink">{error}</p>}
            </form>
        </Modal>
    );
}

function NewInvoiceModal({ projects, onClose, onCreate }) {
    const { money, settings } = useApp();
    const sorted = useMemo(() => [...projects].sort((a, b) => b.date.localeCompare(a.date)), [projects]);
    const [projectId, setProjectId] = useState(sorted[0]?.id ?? "");
    const [error, setError] = useState("");
    const project = sorted.find((p) => p.id === projectId);
    const taxRate = Number(settings.taxRate) || 0;
    const dueDays = Number(settings.invoiceDueDays) || 14;
    const amount = Number(project?.amount) || 0;
    const tax = Math.round(amount * (taxRate / 100));

    const submit = async (e) => {
        e.preventDefault();
        if (!project) return;
        try {
            await onCreate(project, { taxRate, dueDays });
            onClose();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Modal
            title="New invoice"
            description="Bill a completed project. Tax and payment terms come from Settings."
            onClose={onClose}
            footer={
                <>
                    <button type="button" className={btn.secondary} onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" form="new-invoice-form" className={btn.primary} disabled={!project}>
                        Create invoice
                    </button>
                </>
            }
        >
            {sorted.length === 0 ? (
                <EmptyState title="Nothing to bill" message="Every completed project already has an invoice." />
            ) : (
                <form id="new-invoice-form" onSubmit={submit} className="flex flex-col gap-4">
                    <Field label="Project" htmlFor="invoice-project">
                        <select id="invoice-project" className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                            {sorted.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.client} — {p.type} ({formatDate(p.date)})
                                </option>
                            ))}
                        </select>
                    </Field>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-surface-2 p-4 text-sm">
                        <dt className="text-muted">Amount</dt>
                        <dd className="tabular text-right text-ink">{money(amount)}</dd>
                        <dt className="text-muted">Tax ({taxRate}%)</dt>
                        <dd className="tabular text-right text-ink">{money(tax)}</dd>
                        <dt className="font-medium text-ink">Total</dt>
                        <dd className="tabular text-right font-semibold text-ink">{money(amount + tax)}</dd>
                        <dt className="text-muted">Due date</dt>
                        <dd className="tabular text-right text-ink">
                            {formatDate(addDays(todayISO(), dueDays))} ({dueDays} days)
                        </dd>
                    </dl>
                    {error && <p className="text-sm text-critical-ink">{error}</p>}
                </form>
            )}
        </Modal>
    );
}

export default function Invoices() {
    const { money } = useApp();
    const {
        invoices,
        result,
        searchValue,
        setSearchValue,
        statusFilter,
        setStatusFilter,
        billableProjects,
        markAsPaid,
        createInvoice,
        loading,
        error,
        refetch,
    } = useInvoicesSearching();
    const { pageRows, sort, toggleSort, page, setPage, pageCount, pageSize, total, sorted } = useTable(result, {
        initialSort: { key: "issueDate", dir: "desc" },
    });
    const [payingInvoice, setPayingInvoice] = useState(null);
    const [creating, setCreating] = useState(false);

    const stats = useMemo(() => {
        const today = todayISO();
        const last30 = addDays(today, -29);
        const prev30Start = addDays(today, -59);
        const prev30End = addDays(today, -30);
        const paid = invoices.filter((i) => i.paidDate);
        const unpaid = invoices.filter((i) => !i.paidDate);
        const overdue = unpaid.filter((i) => i.status === "Overdue");
        const recentPaid = paid.filter((i) => isInRange(i.paidDate, addDays(today, -89), today));

        const now = parseDate(today);
        const sixMonthsAgo = toISODate(new Date(now.getFullYear(), now.getMonth() - 5, 1));
        const buckets = makeBuckets(sixMonthsAgo, today, "month");
        const monthly = buildTimeSeries(buckets, {
            invoiced: { items: invoices, date: (i) => i.issueDate, value: (i) => i.total },
            collected: { items: paid, date: (i) => i.paidDate, value: (i) => i.total },
        });

        return {
            collected: sum(paid.filter((i) => isInRange(i.paidDate, last30, today)), (i) => i.total),
            collectedBefore: sum(paid.filter((i) => isInRange(i.paidDate, prev30Start, prev30End)), (i) => i.total),
            outstanding: sum(unpaid, (i) => i.total),
            unpaidCount: unpaid.length,
            overdue: sum(overdue, (i) => i.total),
            overdueCount: overdue.length,
            avgDaysToPay: recentPaid.length ? sum(recentPaid, (i) => daysBetween(i.issueDate, i.paidDate)) / recentPaid.length : null,
            monthly,
        };
    }, [invoices]);

    if (error) return <ErrorState message={error} onRetry={refetch} />;
    if (loading && invoices.length === 0) return <LoadingState label="Loading invoices…" />;

    const tabs = [
        { value: "All", label: "All", count: invoices.length },
        ...INVOICE_STATUSES.map((s) => ({
            value: s,
            label: s,
            color: INVOICE_STATUS_COLORS[s],
            count: invoices.filter((i) => i.status === s).length,
        })),
    ];

    const exportCSV = () =>
        downloadCSV(`invoices-${todayISO()}.csv`, sorted, [
            { label: "Invoice", value: (r) => r.number },
            { label: "Client", value: (r) => r.client },
            { label: "Service", value: (r) => r.service },
            { label: "Issued", value: (r) => r.issueDate },
            { label: "Due", value: (r) => r.dueDate },
            { label: "Amount", value: (r) => r.amount },
            { label: "Tax", value: (r) => r.tax },
            { label: "Total", value: (r) => r.total },
            { label: "Status", value: (r) => r.status },
            { label: "Paid on", value: (r) => r.paidDate ?? "" },
            { label: "Method", value: (r) => r.method ?? "" },
        ]);

    const series = [
        { key: "invoiced", label: "Invoiced", color: "var(--series-1)" },
        { key: "collected", label: "Collected", color: "var(--series-2)" },
    ];

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Invoices"
                description="Track what's been billed, what's paid and what's late."
                actions={
                    <>
                        <button type="button" className={btn.secondary} onClick={exportCSV} disabled={total === 0}>
                            <Download size={15} /> Export CSV
                        </button>
                        <button type="button" className={btn.primary} onClick={() => setCreating(true)}>
                            <Plus size={16} /> New invoice
                            {billableProjects.length > 0 && (
                                <span className="tabular rounded-full bg-white/25 px-1.5 text-xs">{billableProjects.length}</span>
                            )}
                        </button>
                    </>
                }
            />

            <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
                <StatTile
                    icon={Wallet}
                    label="Collected"
                    value={money(stats.collected)}
                    delta={percentChange(stats.collected, stats.collectedBefore)}
                    comparison="vs previous 30 days"
                />
                <StatTile icon={Clock} label="Outstanding" value={money(stats.outstanding)} hint={`${stats.unpaidCount} unpaid invoices`} />
                <StatTile icon={AlertCircle} label="Overdue" value={money(stats.overdue)} hint={`${stats.overdueCount} past their due date`} />
                <StatTile
                    icon={Timer}
                    label="Avg. days to get paid"
                    value={stats.avgDaysToPay === null ? "—" : `${Math.round(stats.avgDaysToPay)} days`}
                    hint="Invoices paid in the last 90 days"
                />
            </div>

            <ChartCard
                title="Invoiced vs collected"
                subtitle="Last 6 months, tax included"
                actions={<InlineLegend items={series} />}
                table={{
                    columns: [
                        { key: "fullLabel", label: "Month" },
                        { key: "invoiced", label: "Invoiced", align: "right", format: (v) => money(v) },
                        { key: "collected", label: "Collected", align: "right", format: (v) => money(v) },
                    ],
                    rows: stats.monthly,
                }}
            >
                <BarChart
                    data={stats.monthly}
                    series={series}
                    valueFormatter={(v) => money(v)}
                    tickFormatter={(v) => money(v, { compact: true })}
                    height={240}
                />
            </ChartCard>

            <div className="rounded-xl border border-line bg-surface shadow-[var(--shadow)]">
                <div className="flex flex-col gap-3 border-b border-line p-4">
                    <SearchInput
                        value={searchValue}
                        onChange={(v) => {
                            setSearchValue(v);
                            setPage(1);
                        }}
                        placeholder="Search invoice #, client or service"
                    />
                    <FilterTabs
                        options={tabs}
                        value={statusFilter}
                        onChange={(v) => {
                            setStatusFilter(v);
                            setPage(1);
                        }}
                    />
                </div>
                <div className="relative overflow-x-auto">
                    <InvoicesTable invoices={pageRows} sort={sort} onSort={toggleSort} onMarkPaid={setPayingInvoice} />
                </div>
                {total === 0 && <EmptyState title="No invoices found" message="Try a different search or filter." />}
                <div className="border-t border-line">
                    <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onPageChange={setPage} noun="invoices" />
                </div>
            </div>

            {payingInvoice && <MarkPaidModal invoice={payingInvoice} onClose={() => setPayingInvoice(null)} onConfirm={markAsPaid} />}
            {creating && <NewInvoiceModal projects={billableProjects} onClose={() => setCreating(false)} onCreate={createInvoice} />}
        </div>
    );
}
