import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, DollarSign, Folder, Mail, MapPin, Phone, Receipt, Trash2, TrendingUp, User } from "lucide-react";
import BarChart from "../components/Charts/BarCharts";
import PieChart from "../components/Charts/PieChart";
import { CLIENT_STATUS_COLORS, withClientStats } from "../components/Clients/clientStats";
import Legend from "../components/Legend";
import Card from "../components/ui/Card";
import ChartCard from "../components/ui/ChartCard";
import { Avatar, Pagination, SortHeader } from "../components/ui/Controls";
import Modal from "../components/ui/Modal";
import StatTile from "../components/ui/StatTile";
import StatusBadge, { InvoiceStatusBadge, ProjectStatusBadge } from "../components/ui/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { btn, tdClass } from "../components/ui/styles";
import { useApp } from "../contexts/AppContext";
import { useCollections } from "../hooks/useFetch";
import useTable from "../hooks/useTable";
import { api, ENDPOINTS } from "../services/api";
import { PROJECT_STATUS_COLORS, PROJECT_STATUSES } from "../utils/constants";
import { buildTimeSeries, formatDate, getInitials, getInvoiceStatus, getRangeBounds, makeBuckets } from "../utils/dataHelpers";

const URLS = { clients: ENDPOINTS.clients, projects: ENDPOINTS.projects, invoices: ENDPOINTS.invoices };

const PROJECT_TABLE_COLUMNS = [
    { key: "type", label: "Service" },
    { key: "editor", label: "Editor" },
    { key: "status", label: "Status" },
    { key: "date", label: "Start date" },
    { key: "amount", label: "Amount", align: "right" },
];

export default function ClientDetails() {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const { money } = useApp();
    const { data, loading, error, refetch } = useCollections(URLS);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const view = useMemo(() => {
        const raw = data.clients.find((c) => c.id === clientId);
        if (!raw) return null;
        const projects = data.projects.filter((p) => p.client === raw.name);
        const invoices = data.invoices
            .filter((inv) => inv.client === raw.name)
            .map((inv) => ({ ...inv, status: getInvoiceStatus(inv) }))
            .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
        const [client] = withClientStats([raw], projects, invoices);

        const bounds = getRangeBounds("12m");
        const monthly = buildTimeSeries(makeBuckets(bounds.start, bounds.end, "month"), {
            revenue: { items: projects, date: (p) => p.date, value: (p) => p.amount },
        });
        const statusSplit = PROJECT_STATUSES.map((status) => ({
            name: status,
            value: projects.filter((p) => p.status === status).length,
            color: PROJECT_STATUS_COLORS[status],
        })).filter((s) => s.value > 0);

        return { client, projects, invoices, monthly, statusSplit };
    }, [data, clientId]);

    const projectTable = useTable(view?.projects ?? [], { initialSort: { key: "date", dir: "desc" }, pageSize: 8 });

    if (error) return <ErrorState message={error} onRetry={refetch} />;
    if (loading && data.clients.length === 0) return <LoadingState label="Loading client…" />;
    if (!view) {
        return (
            <EmptyState
                title="Client not found"
                message="It may have been deleted."
                action={
                    <Link to="/clients" className={btn.secondary}>
                        Back to clients
                    </Link>
                }
            />
        );
    }

    const { client, invoices } = view;
    const avgValue = client.projects ? client.revenue / client.projects : 0;

    const handleDelete = async () => {
        try {
            await api.remove(`${ENDPOINTS.clients}/${client.id}`);
            navigate("/clients");
        } catch (e) {
            setDeleteError(e.message);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <Link to="/clients" className="inline-flex w-fit items-center gap-1 text-sm text-ink-2 hover:text-ink">
                <ArrowLeft size={15} /> All clients
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
                <div className="flex min-w-0 items-start gap-4">
                    <Avatar initials={getInitials(client.name)} size={56} />
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-semibold text-ink">{client.name}</h1>
                            <StatusBadge label={client.status} color={CLIENT_STATUS_COLORS[client.status]} />
                        </div>
                        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-2">
                            {client.contact && (
                                <li className="flex items-center gap-1.5">
                                    <User size={14} className="text-muted" /> {client.contact}
                                </li>
                            )}
                            <li className="flex items-center gap-1.5">
                                <Mail size={14} className="text-muted" />
                                <a href={`mailto:${client.email}`} className="hover:underline">
                                    {client.email}
                                </a>
                            </li>
                            {client.phone && (
                                <li className="flex items-center gap-1.5">
                                    <Phone size={14} className="text-muted" /> {client.phone}
                                </li>
                            )}
                            {client.city && (
                                <li className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-muted" /> {client.city}
                                </li>
                            )}
                            {client.joinDate && (
                                <li className="flex items-center gap-1.5">
                                    <CalendarDays size={14} className="text-muted" /> Client since {formatDate(client.joinDate)}
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
                <button type="button" className={btn.danger} onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={15} /> Delete client
                </button>
            </div>

            <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
                <StatTile icon={DollarSign} label="Lifetime revenue" value={money(client.revenue)} />
                <StatTile icon={Folder} label="Projects" value={client.projects} hint={client.lastProjectDate ? `Last on ${formatDate(client.lastProjectDate)}` : "No projects yet"} />
                <StatTile icon={TrendingUp} label="Avg. project value" value={money(avgValue)} />
                <StatTile
                    icon={Receipt}
                    label="Outstanding"
                    value={money(client.outstanding)}
                    hint={client.overdue > 0 ? `${money(client.overdue)} overdue` : "Nothing overdue"}
                />
            </div>

            <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
                <ChartCard
                    className="col-span-2 max-lg:col-span-1"
                    title="Revenue by month"
                    subtitle="Last 12 months"
                    table={{
                        columns: [
                            { key: "fullLabel", label: "Month" },
                            { key: "revenue", label: "Revenue", align: "right", format: (v) => money(v) },
                        ],
                        rows: view.monthly,
                    }}
                >
                    <BarChart
                        data={view.monthly}
                        series={[{ key: "revenue", label: "Revenue", color: "var(--series-1)" }]}
                        valueFormatter={(v) => money(v)}
                        tickFormatter={(v) => money(v, { compact: true })}
                        height={240}
                    />
                </ChartCard>
                <Card title="Project status" subtitle="All time">
                    {view.statusSplit.length === 0 ? (
                        <EmptyState title="No projects yet" />
                    ) : (
                        <>
                            <PieChart data={view.statusSplit} centerValue={client.projects} centerLabel="projects" height={160} />
                            <div className="mt-5">
                                <Legend items={view.statusSplit} />
                            </div>
                        </>
                    )}
                </Card>
            </div>

            <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
                <Card title="Projects" className="col-span-2 max-lg:col-span-1" bodyClassName="!px-0 !pb-0">
                    {view.projects.length === 0 ? (
                        <EmptyState title="No projects yet" />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[560px] border-collapse">
                                    <thead>
                                        <tr className="border-y border-line bg-surface-2">
                                            {PROJECT_TABLE_COLUMNS.map((c) => (
                                                <SortHeader
                                                    key={c.key}
                                                    label={c.label}
                                                    sortKey={c.key}
                                                    sort={projectTable.sort}
                                                    onSort={projectTable.toggleSort}
                                                    align={c.align}
                                                    className={c.align === "right" ? "text-right" : ""}
                                                />
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projectTable.pageRows.map((p) => (
                                            <tr key={p.id} className="border-b border-line last:border-0">
                                                <td className={`${tdClass} font-medium`}>{p.type}</td>
                                                <td className={`${tdClass} text-ink-2`}>{p.editor || "—"}</td>
                                                <td className={tdClass}>
                                                    <ProjectStatusBadge status={p.status} />
                                                </td>
                                                <td className={`${tdClass} tabular text-ink-2`}>{formatDate(p.date)}</td>
                                                <td className={`${tdClass} tabular text-right`}>{money(p.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="border-t border-line">
                                <Pagination
                                    page={projectTable.page}
                                    pageCount={projectTable.pageCount}
                                    total={projectTable.total}
                                    pageSize={projectTable.pageSize}
                                    onPageChange={projectTable.setPage}
                                    noun="projects"
                                />
                            </div>
                        </>
                    )}
                </Card>

                <Card title="Invoices" subtitle={`${invoices.length} total`}>
                    {invoices.length === 0 ? (
                        <EmptyState title="No invoices yet" />
                    ) : (
                        <ul className="flex max-h-[460px] flex-col divide-y divide-line overflow-y-auto">
                            {invoices.map((inv) => (
                                <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                                    <div className="min-w-0">
                                        <p className="tabular text-ink">{inv.number}</p>
                                        <p className="truncate text-xs text-muted">
                                            {inv.service} · {formatDate(inv.issueDate)}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                        <span className="tabular font-medium text-ink">{money(inv.total)}</span>
                                        <InvoiceStatusBadge status={inv.status} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

            {confirmDelete && (
                <Modal
                    title={`Delete ${client.name}?`}
                    description="The client is removed from your list. Their past projects and invoices are kept for your records."
                    onClose={() => setConfirmDelete(false)}
                    footer={
                        <>
                            <button type="button" className={btn.secondary} onClick={() => setConfirmDelete(false)}>
                                Cancel
                            </button>
                            <button type="button" className={`${btn.primary} !bg-[var(--critical)]`} onClick={handleDelete}>
                                Delete client
                            </button>
                        </>
                    }
                >
                    {deleteError ? <p className="text-sm text-critical-ink">{deleteError}</p> : <p className="text-sm text-ink-2">This can't be undone.</p>}
                </Modal>
            )}
        </div>
    );
}
