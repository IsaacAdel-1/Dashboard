import { useMemo } from "react";
import { DollarSign, PiggyBank, Receipt, TrendingUp } from "lucide-react";
import BarChart from "../components/Charts/BarCharts";
import { InlineLegend } from "../components/Legend";
import Card from "../components/ui/Card";
import ChartCard from "../components/ui/ChartCard";
import PageHeader from "../components/ui/PageHeader";
import StatTile from "../components/ui/StatTile";
import StatusBadge from "../components/ui/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { tdClass, thClass } from "../components/ui/styles";
import { useApp } from "../contexts/AppContext";
import { useCollections } from "../hooks/useFetch";
import { ENDPOINTS } from "../services/api";
import {
    buildTimeSeries,
    formatDate,
    formatPercent,
    getRangeBounds,
    groupSum,
    isInRange,
    makeBuckets,
    percentChange,
    sum,
} from "../utils/dataHelpers";

const URLS = { projects: ENDPOINTS.projects, expenses: ENDPOINTS.expenses, team: ENDPOINTS.team };

function totals(projects, expenses) {
    const revenue = sum(projects, (p) => p.amount);
    const cost = sum(expenses, (e) => e.amount);
    const profit = revenue - cost;
    return {
        revenue,
        cost,
        profit,
        margin: revenue > 0 ? (profit / revenue) * 100 : null,
        avgValue: projects.length ? revenue / projects.length : 0,
        count: projects.length,
    };
}

export default function Analytics() {
    const { range, money } = useApp();
    const { data, loading, error, refetch } = useCollections(URLS);

    const view = useMemo(() => {
        const bounds = getRangeBounds(range);
        const inPeriod = (start, end) => ({
            projects: data.projects.filter((p) => isInRange(p.date, start, end)),
            expenses: data.expenses.filter((e) => isInRange(e.date, start, end)),
        });
        const current = inPeriod(bounds.start, bounds.end);
        const previous = inPeriod(bounds.prevStart, bounds.prevEnd);

        const buckets = makeBuckets(bounds.start, bounds.end, bounds.granularity);
        const series = buildTimeSeries(buckets, {
            revenue: { items: current.projects, date: (p) => p.date, value: (p) => p.amount },
            expenses: { items: current.expenses, date: (e) => e.date, value: (e) => e.amount },
            projects: { items: current.projects, date: (p) => p.date },
        }).map((row) => ({ ...row, profit: row.revenue - row.expenses }));

        const avgByService = groupSum(current.projects, (p) => p.type, (p) => p.amount)
            .map((s) => ({ ...s, avg: Math.round(s.value / s.count) }))
            .sort((a, b) => b.avg - a.avg);

        const expenseByCategory = groupSum(current.expenses, (e) => e.category, (e) => e.amount);

        const workload = data.team
            .filter((m) => m.role !== "Project Manager")
            .map((member) => {
                const mine = current.projects.filter((p) => p.editor === member.name);
                const open = mine.filter((p) => p.status !== "Completed").length;
                return {
                    ...member,
                    projects: mine.length,
                    open,
                    revenue: sum(mine, (p) => p.amount),
                };
            })
            .sort((a, b) => b.projects - a.projects);

        return {
            bounds,
            now: totals(current.projects, current.expenses),
            before: totals(previous.projects, previous.expenses),
            series,
            avgByService,
            expenseByCategory,
            workload,
        };
    }, [data, range]);

    if (error) return <ErrorState message={error} onRetry={refetch} />;
    if (loading && data.projects.length === 0) return <LoadingState label="Loading analytics…" />;

    const { now, before, bounds } = view;
    const comparison = `vs previous ${bounds.label.replace("Last ", "")}`;
    const compact = (v) => money(v, { compact: true });
    const full = (v) => money(v);
    const moneySeries = [
        { key: "revenue", label: "Revenue", color: "var(--series-1)" },
        { key: "expenses", label: "Expenses", color: "var(--series-2)" },
    ];
    const maxWorkload = Math.max(1, ...view.workload.map((m) => m.projects));

    return (
        <div className={`flex flex-col gap-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
            <PageHeader
                title="Analytics"
                description={`${bounds.label} · ${formatDate(bounds.start)} – ${formatDate(bounds.end)}. Change the period from the top bar.`}
            />

            <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
                <StatTile icon={DollarSign} label="Revenue" value={money(now.revenue)} delta={percentChange(now.revenue, before.revenue)} comparison={comparison} />
                <StatTile
                    icon={Receipt}
                    label="Expenses"
                    value={money(now.cost)}
                    delta={percentChange(now.cost, before.cost)}
                    upIsGood={false}
                    comparison={comparison}
                />
                <StatTile
                    icon={PiggyBank}
                    label="Net profit"
                    value={money(now.profit)}
                    delta={now.margin === null || before.margin === null ? null : now.margin - before.margin}
                    deltaUnit="pts"
                    comparison="margin change"
                    hint={now.margin === null ? undefined : `${formatPercent(now.margin)} profit margin`}
                />
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
                    title="Revenue vs expenses"
                    subtitle={`Per ${bounds.granularity}`}
                    actions={<InlineLegend items={moneySeries} />}
                    table={{
                        columns: [
                            { key: "fullLabel", label: "Period" },
                            { key: "projects", label: "Projects", align: "right" },
                            { key: "revenue", label: "Revenue", align: "right", format: full },
                            { key: "expenses", label: "Expenses", align: "right", format: full },
                            { key: "profit", label: "Profit", align: "right", format: full },
                        ],
                        rows: view.series,
                    }}
                >
                    <BarChart data={view.series} series={moneySeries} valueFormatter={full} tickFormatter={compact} height={280} />
                </ChartCard>

                <ChartCard
                    title="Where the money goes"
                    subtitle="Expenses by category"
                    table={{
                        columns: [
                            { key: "name", label: "Category" },
                            { key: "count", label: "Entries", align: "right" },
                            { key: "value", label: "Amount", align: "right", format: full },
                        ],
                        rows: view.expenseByCategory,
                    }}
                >
                    {view.expenseByCategory.length === 0 ? (
                        <EmptyState title="No expenses in this period" />
                    ) : (
                        <BarChart
                            data={view.expenseByCategory}
                            xKey="name"
                            orientation="bars"
                            series={[{ key: "value", label: "Spent", color: "var(--series-2)" }]}
                            valueFormatter={compact}
                            showValues
                            height={Math.max(180, view.expenseByCategory.length * 42)}
                            categoryWidth={120}
                        />
                    )}
                </ChartCard>
            </div>

            <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
                <ChartCard
                    title="Projects started"
                    subtitle={`New projects per ${bounds.granularity}`}
                    table={{
                        columns: [
                            { key: "fullLabel", label: "Period" },
                            { key: "projects", label: "Projects", align: "right" },
                        ],
                        rows: view.series,
                    }}
                >
                    <BarChart data={view.series} series={[{ key: "projects", label: "Projects", color: "var(--series-1)" }]} height={240} />
                </ChartCard>

                <ChartCard
                    title="Average project value"
                    subtitle="By service, in this period"
                    table={{
                        columns: [
                            { key: "name", label: "Service" },
                            { key: "count", label: "Projects", align: "right" },
                            { key: "avg", label: "Avg. value", align: "right", format: full },
                            { key: "value", label: "Total", align: "right", format: full },
                        ],
                        rows: view.avgByService,
                    }}
                >
                    {view.avgByService.length === 0 ? (
                        <EmptyState title="No projects in this period" />
                    ) : (
                        <BarChart
                            data={view.avgByService}
                            xKey="name"
                            orientation="bars"
                            series={[{ key: "avg", label: "Avg. value", color: "var(--series-1)" }]}
                            valueFormatter={full}
                            showValues
                            height={Math.max(200, view.avgByService.length * 40)}
                            categoryWidth={112}
                        />
                    )}
                </ChartCard>
            </div>

            <Card title="Team workload" subtitle="Projects each editor started in this period" bodyClassName="!px-0 !pb-1">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse">
                        <thead>
                            <tr className="border-y border-line bg-surface-2">
                                <th className={thClass}>Editor</th>
                                <th className={thClass}>Status</th>
                                <th className={`${thClass} w-[34%]`}>Projects</th>
                                <th className={`${thClass} text-right`}>Still open</th>
                                <th className={`${thClass} text-right`}>Revenue handled</th>
                            </tr>
                        </thead>
                        <tbody>
                            {view.workload.map((m) => (
                                <tr key={m.id} className="border-b border-line last:border-0">
                                    <td className={tdClass}>
                                        <p className="font-medium">{m.name}</p>
                                        <p className="text-xs text-muted">{m.role}</p>
                                    </td>
                                    <td className={tdClass}>
                                        <StatusBadge label={m.status} color={m.status === "Active" ? "var(--good)" : "var(--warning)"} />
                                    </td>
                                    <td className={tdClass}>
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent-soft">
                                                <div className="h-full rounded-full bg-accent" style={{ width: `${(m.projects / maxWorkload) * 100}%` }} />
                                            </div>
                                            <span className="tabular w-8 text-right">{m.projects}</span>
                                        </div>
                                    </td>
                                    <td className={`${tdClass} tabular text-right`}>{m.open}</td>
                                    <td className={`${tdClass} tabular text-right`}>{money(m.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
