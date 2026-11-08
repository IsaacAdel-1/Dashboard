import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, UserCheck, Users, Wallet } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useCollections } from "../../hooks/useFetch";
import { useSearch } from "../../hooks/useSearch";
import { ENDPOINTS } from "../../services/api";
import { compareValues, formatNumber, sum } from "../../utils/dataHelpers";
import { FilterTabs, SearchInput } from "../ui/Controls";
import PageHeader from "../ui/PageHeader";
import StatTile from "../ui/StatTile";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import { btn } from "../ui/styles";
import ClientCard from "./ClientCard";
import { CLIENT_STATUS_COLORS, withClientStats } from "./clientStats";
import NewClientForm from "./NewClientForm";

const URLS = { clients: ENDPOINTS.clients, projects: ENDPOINTS.projects, invoices: ENDPOINTS.invoices };
const SEARCH_KEYS = ["name", "email", "contact", "city"];
const SORTS = {
    revenue: { label: "Revenue", fn: (a, b) => b.revenue - a.revenue },
    projects: { label: "Projects", fn: (a, b) => b.projects - a.projects },
    recent: { label: "Recently active", fn: (a, b) => compareValues(b.lastProjectDate, a.lastProjectDate) },
    name: { label: "Name (A–Z)", fn: (a, b) => a.name.localeCompare(b.name) },
};

const Clients = () => {
    const { money } = useApp();
    const navigate = useNavigate();
    const { data, setCollection, loading, error, refetch } = useCollections(URLS);
    const [showForm, setShowForm] = useState(false);
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortKey, setSortKey] = useState("revenue");

    const clients = useMemo(() => withClientStats(data.clients, data.projects, data.invoices), [data]);
    const { searchValue, setSearchValue, result } = useSearch({ data: clients, keys: SEARCH_KEYS });

    const shown = useMemo(() => {
        const filtered = statusFilter === "All" ? result : result.filter((c) => c.status === statusFilter);
        return [...filtered].sort(SORTS[sortKey].fn);
    }, [result, statusFilter, sortKey]);

    if (error) return <ErrorState message={error} onRetry={refetch} />;
    if (loading && data.clients.length === 0) return <LoadingState label="Loading clients…" />;

    const active = clients.filter((c) => c.status === "Active").length;
    const totalRevenue = sum(clients, (c) => c.revenue);
    const tabs = ["All", "Active", "Inactive", "New"].map((status) => ({
        value: status,
        label: status,
        color: CLIENT_STATUS_COLORS[status],
        count: status === "All" ? result.length : result.filter((c) => c.status === status).length,
    }));

    const handleCreated = (client) => {
        setCollection("clients", (prev) => [...prev, client]);
        setShowForm(false);
        navigate(`/clients/${client.id}`);
    };

    return (
        <div className="ClientsPage">
            <PageHeader
                title="Clients"
                description="Everyone you've worked with, and how much work they bring in."
                actions={
                    <button type="button" className={btn.primary} onClick={() => setShowForm(true)}>
                        <Plus size={16} /> New client
                    </button>
                }
            />

            <div className="mb-6 grid grid-cols-3 gap-4 max-md:grid-cols-1">
                <StatTile icon={Users} label="Total clients" value={formatNumber(clients.length)} />
                <StatTile icon={UserCheck} label="Active clients" value={formatNumber(active)} hint="Had a project in the last 90 days" />
                <StatTile
                    icon={Wallet}
                    label="Avg. revenue per client"
                    value={money(clients.length ? totalRevenue / clients.length : 0)}
                    hint={`${money(totalRevenue)} lifetime`}
                />
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <SearchInput value={searchValue} onChange={setSearchValue} placeholder="Search clients" className="min-w-[220px] flex-1" />
                <label className="flex items-center gap-2 text-sm text-ink-2">
                    Sort by
                    <select
                        className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-accent"
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value)}
                    >
                        {Object.entries(SORTS).map(([key, s]) => (
                            <option key={key} value={key}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div className="mb-5">
                <FilterTabs options={tabs} value={statusFilter} onChange={setStatusFilter} />
            </div>

            {shown.length === 0 ? (
                <div className="rounded-xl border border-line bg-surface">
                    <EmptyState title="No clients found" message={searchValue ? `Nothing matches "${searchValue}".` : "Try another filter."} />
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1 min-[1500px]:grid-cols-4">
                    {shown.map((client) => (
                        <ClientCard client={client} key={client.id} />
                    ))}
                </div>
            )}

            {showForm && (
                <NewClientForm existingNames={data.clients.map((c) => c.name)} onClose={() => setShowForm(false)} onCreated={handleCreated} />
            )}
        </div>
    );
};

export default Clients;
