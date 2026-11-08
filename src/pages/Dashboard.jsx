import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, DollarSign, Folder, TrendingUp, Users } from "lucide-react";
import AreaChart from "../components/Charts/AreaChart";
import BarChart from "../components/Charts/BarCharts";
import PieChart from "../components/Charts/PieChart";
import Legend from "../components/Legend";
import Card from "../components/ui/Card";
import ChartCard from "../components/ui/ChartCard";
import PageHeader from "../components/ui/PageHeader";
import StatTile from "../components/ui/StatTile";
import { InvoiceStatusBadge, ProjectStatusBadge } from "../components/ui/StatusBadge";
import { Meter } from "../components/ui/Controls";
import { ErrorState, LoadingState, EmptyState } from "../components/ui/States";
import { tdClass, thClass } from "../components/ui/styles";
import { useApp } from "../contexts/AppContext";
import { useCollections } from "../hooks/useFetch";
import { ENDPOINTS } from "../services/api";
import { PROJECT_STATUSES, PROJECT_STATUS_COLORS } from "../utils/constants";
import {
    buildTimeSeries,
    daysBetween,
    formatDate,
    formatNumber,
    formatPercent,
    getInvoiceStatus,
    getRangeBounds,
    groupSum,
    isInRange,
    makeBuckets,
    percentChange,
    sum,
    todayISO,
} from "../utils/dataHelpers";

const URLS = { projects: ENDPOINTS.projects, invoices: ENDPOINTS.invoices, clients: ENDPOINTS.clients };

function summarize(projects) {
    const revenue = sum(projects, (p) => p.amount);
    return {
        revenue,
        count: projects.length,
        clients: new Set(projects.map((p) => p.client)).size,
        avgValue: projects.length ? revenue / projects.length : 0,
    };
}

function dueLabel(dueDate, today) {
    const days = daysBetween(today, dueDate);
    if (days < 0) return { text: `${-days}d overdue`, late: true };
    if (days === 0) return { text: "Due today", late: false };
    return { text: `Due in ${days}d`, late: false };
}

const Dashboard = () => {
    const { range, money, settings } = useApp();
    const { data, loading, error, refetch } = useCollections(URLS);
    const { projects, invoices, clients } = data;

    const view = useMemo(() => {
        const today = todayISO();
        const bounds = getRangeBounds(range, today);
        const current = projects.filter((p) => isInRange(p.date, bounds.start, bounds.end));
        const previous = projects.filter((p) => isInRange(p.date, bounds.prevStart, bounds.prevEnd));

        const buckets = makeBuckets(bounds.start, bounds.end, bounds.granularity);
        const trend = buildTimeSeries(buckets, {
            revenue: { items: current, date: (p) => p.date, value: (p) => p.amount },
            projects: { items: current, date: (p) => p.date },
        });

        const statusSplit = PROJECT_STATUSES.map((status) => ({
            name: status,
            value: current.filter((p) => p.status === status).length,
            color: PROJECT_STATUS_COLORS[status],
        }));

        const byService = groupSum(current, (p) => p.type, (p) => p.amount);
        const topClients = groupSum(current, (p) => p.client, (p) => p.amount).slice(0, 5);

        const monthStart = today.slice(0, 8) + "01";
        const monthRevenue = sum(
            projects.filter((p) => isInRange(p.date, monthStart, today)),
            (p) => p.amount
        );

        const deadlines = projects
            .filter((p) => p.status !== "Completed" && p.dueDate)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            .slice(0, 5);

        const unpaid = invoices
            .filter((inv) => !inv.paidDate)
            .map((inv) => ({ ...inv, status: getInvoiceStatus(inv, today) }))
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

        const recent = [...projects].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);

        return {
            today,
            bounds,
            now: summarize(current),
            before: summarize(previous),
            trend,
            statusSplit,
            byService,
            topClients,
            monthRevenue,
            deadlines,
            unpaid,
            recent,
        };
    }, [projects, invoices, range]);

    if (error) return <ErrorState message={error} onRetry={refetch} />;
    if (loading && projects.length === 0) return <LoadingState label="Loading dashboard…" />;

    const { now, before, bounds } = view;
    const comparison = `vs previous ${bounds.label.replace("Last ", "")}`;
    const clientIdByName = Object.fromEntries(clients.map((c) => [c.name, c.id]));
    const compactMoney = (v) => money(v, { compact: true });
    const goal = Number(settings.monthlyRevenueGoal) || 0;
    const outstanding = sum(view.unpaid, (i) => i.total);
    const topClientMax = view.topClients[0]?.value ?? 0;

    return (
        <div className={`flex flex-col gap-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
            <PageHeader
                title={`Welcome back, ${settings.ownerName.split(" ")[0]}`}
                description={`Here's how ${settings.studioName} is doing — ${bounds.label.toLowerCase()} (${formatDate(bounds.start)} – ${formatDate(bounds.end)}).`}
            />

            <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
                <StatTile icon={DollarSign} label="Revenue" value={money(now.revenue)} delta={percentChange(now.revenue, before.revenue)} comparison={comparison} />
                <StatTile icon={Folder} label="Projects" value={formatNumber(now.count)} delta={percentChange(now.count, before.count)} comparison={comparison} />
                <StatTile icon={Users} label="Active clients" value={formatNumber(now.clients)} delta={percentChange(now.clients, before.clients)} comparison={comparison} />
                <StatTile
                    icon={TrendingUp}
                    label="Avg. project value"
                    value={money(now.avgValue)}
                    delta={percentChange(now.avgValue, before.avgValue)}
                    comparison={comparison}
                />
            </div>

            <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
                <ChartCard
                    className="col-span-2 max-lg:col-span-1"
                    title="Revenue trend"
                    subtitle={`Booked project revenue per ${bounds.granularity}`}
                    table={{
                        columns: [
                            { key: "fullLabel", label: "Period" },
                            { key: "projects", label: "Projects", align: "right" },
                            { key: "revenue", label: "Revenue", align: "right", format: (v) => money(v) },
                        ],
                        rows: view.trend,
                    }}
                >
                    <AreaChart
                        data={view.trend}
                        series={[{ key: "revenue", label: "Revenue", color: "var(--series-1)" }]}
                        valueFormatter={(v) => money(v)}
                        tickFormatter={compactMoney}
                        height={270}
                    />
                </ChartCard>

                <ChartCard
                    title="Project status"
                    subtitle="Projects started in this period"
                    table={{
                        columns: [
                            { key: "name", label: "Status" },
                            { key: "value", label: "Projects", align: "right" },
                        ],
                        rows: view.statusSplit,
                    }}
                >
                    <PieChart data={view.statusSplit} centerValue={formatNumber(now.count)} centerLabel="projects" height={170} />
                    <div className="mt-5">
                        <Legend items={view.statusSplit} />
                    </div>
                </ChartCard>
            </div>

            <div className="grid grid-cols-3 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
                <ChartCard
                    title="Revenue by service"
                    subtitle="Which work brings the money in"
                    table={{
                        columns: [
                            { key: "name", label: "Service" },
                            { key: "count", label: "Projects", align: "right" },
                            { key: "value", label: "Revenue", align: "right", format: (v) => money(v) },
                        ],
                        rows: view.byService,
                    }}
                >
                    {view.byService.length === 0 ? (
                        <EmptyState title="No projects in this period" />
                    ) : (
                        <BarChart
                            data={view.byService}
                            xKey="name"
                            orientation="bars"
                            series={[{ key: "value", label: "Revenue", color: "var(--series-1)" }]}
                            valueFormatter={compactMoney}
                            showValues
                            height={Math.max(160, view.byService.length * 40)}
                            categoryWidth={112}
                        />
                    )}
                </ChartCard>

                <Card title="Top clients" subtitle="By revenue in this period" actions={<Link to="/clients" className="text-sm text-accent hover:underline">All clients</Link>}>
                    {view.topClients.length === 0 ? (
                        <EmptyState title="No client work in this period" />
                    ) : (
                        <ol className="flex flex-col gap-4">
                            {view.topClients.map((client, i) => (
                                <li key={client.name} className="flex flex-col gap-1.5">
                                    <div className="flex items-baseline justify-between gap-3 text-sm">
                                        <span className="flex min-w-0 items-baseline gap-2">
                                            <span className="tabular text-muted">{i + 1}</span>
                                            {clientIdByName[client.name] ? (
                                                <Link to={`/clients/${clientIdByName[client.name]}`} className="truncate font-medium text-ink hover:underline">
                                                    {client.name}
                                                </Link>
                                            ) : (
                                                <span className="truncate font-medium text-ink">{client.name}</span>
                                            )}
                                        </span>
                                        <span className="tabular shrink-0 text-ink">
                                            {money(client.value)}
                                            <span className="ml-2 text-xs text-muted">{client.count} proj.</span>
                                        </span>
                                    </div>
                                    <Meter value={client.value} max={topClientMax} label={`${client.name} revenue`} />
                                </li>
                            ))}
                        </ol>
                    )}
                </Card>

                <Card title="This month" subtitle={`Goal: ${money(goal)}`} className="max-xl:col-span-2 max-md:col-span-1">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[26px] font-semibold text-ink">{money(view.monthRevenue)}</span>
                        <span className="text-sm text-muted">{goal ? formatPercent((view.monthRevenue / goal) * 100) : "—"} of goal</span>
                    </div>
                    <div className="mt-2">
                        <Meter value={view.monthRevenue} max={goal} label="Monthly revenue goal" />
                    </div>

                    <h3 className="mt-6 mb-2 text-sm font-semibold text-ink">Upcoming deadlines</h3>
                    {view.deadlines.length === 0 ? (
                        <p className="text-sm text-muted">Nothing open. Nice!</p>
                    ) : (
                        <ul className="flex flex-col divide-y divide-line">
                            {view.deadlines.map((p) => {
                                const due = dueLabel(p.dueDate, view.today);
                                return (
                                    <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                        <div className="min-w-0">
                                            <p className="truncate text-ink">{p.client}</p>
                                            <p className="truncate text-xs text-muted">
                                                {p.type} · {p.editor || "Unassigned"}
                                            </p>
                                        </div>
                                        <span className={`shrink-0 text-xs font-medium ${due.late ? "text-critical-ink" : "text-ink-2"}`}>{due.text}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>
            </div>

            <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
                <Card
                    className="col-span-2 max-lg:col-span-1"
                    title="Recent projects"
                    actions={
                        <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                            View all <ArrowRight size={14} />
                        </Link>
                    }
                    bodyClassName="!px-0 !pb-2"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse">
                            <thead>
                                <tr className="border-y border-line bg-surface-2">
                                    <th className={thClass}>Client</th>
                                    <th className={thClass}>Service</th>
                                    <th className={thClass}>Status</th>
                                    <th className={thClass}>Date</th>
                                    <th className={`${thClass} text-right`}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {view.recent.map((p) => (
                                    <tr key={p.id} className="border-b border-line last:border-0 hover:bg-hover">
                                        <td className={`${tdClass} font-medium`}>{p.client}</td>
                                        <td className={`${tdClass} text-ink-2`}>{p.type}</td>
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
                </Card>

                <Card
                    title="Unpaid invoices"
                    subtitle={`${view.unpaid.length} open · ${money(outstanding)} outstanding`}
                    actions={
                        <Link to="/invoices" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                            Invoices <ArrowRight size={14} />
                        </Link>
                    }
                >
                    {view.unpaid.length === 0 ? (
                        <EmptyState title="All invoices are paid" />
                    ) : (
                        <ul className="flex flex-col divide-y divide-line">
                            {view.unpaid.slice(0, 6).map((inv) => (
                                <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                                    <div className="min-w-0">
                                        <p className="truncate text-ink">{inv.client}</p>
                                        <p className="tabular text-xs text-muted">
                                            {inv.number} · due {formatDate(inv.dueDate)}
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
        </div>
    );
};

export default Dashboard;
