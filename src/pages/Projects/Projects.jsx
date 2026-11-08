import "./Projects.css";
import { useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import ProjectRow from "../../components/ProjectTable/Project/Row";
import NewRow from "../../components/ProjectTable/NewProject/Row";
import { PROJECT_COLUMNS } from "../../components/ProjectTable/columns";
import { FilterTabs, Pagination, SearchInput, SortHeader } from "../../components/ui/Controls";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { btn, thClass } from "../../components/ui/styles";
import { useApp } from "../../contexts/AppContext";
import useProjectsTable from "../../hooks/useProjectsTable";
import { useSearch } from "../../hooks/useSearch";
import useTable from "../../hooks/useTable";
import { PROJECT_STATUSES, PROJECT_STATUS_COLORS } from "../../utils/constants";
import { downloadCSV, formatNumber, sum, todayISO } from "../../utils/dataHelpers";

const SEARCH_KEYS = ["client", "type", "editor", "status"];

export default function Projects() {
    const { money } = useApp();
    const table = useProjectsTable();
    const { projects, options, loading, error, refetch, editing } = table;

    // All hooks are called before any early return (Rules of Hooks):
    // React needs the same hooks in the same order on every render.
    const { searchValue, setSearchValue, result } = useSearch({ data: projects, keys: SEARCH_KEYS });
    const [statusFilter, setStatusFilter] = useState("All");
    const [serviceFilter, setServiceFilter] = useState("All");
    const [toDelete, setToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState("");

    // search -> service filter -> status filter, so they all work together
    const byService = useMemo(
        () => (serviceFilter === "All" ? result : result.filter((p) => p.type === serviceFilter)),
        [result, serviceFilter]
    );
    const visible = useMemo(
        () => (statusFilter === "All" ? byService : byService.filter((p) => p.status === statusFilter)),
        [byService, statusFilter]
    );
    const { pageRows, sort, toggleSort, page, setPage, pageCount, pageSize, total, sorted } = useTable(visible, {
        initialSort: { key: "date", dir: "desc" },
    });

    const statusTabs = [
        { value: "All", label: "All", count: byService.length },
        ...PROJECT_STATUSES.map((status) => ({
            value: status,
            label: status,
            color: PROJECT_STATUS_COLORS[status],
            count: byService.filter((p) => p.status === status).length,
        })),
    ];

    const resetPage = (setter) => (value) => {
        setter(value);
        setPage(1);
    };

    const confirmDelete = async () => {
        try {
            await table.deleteProject(toDelete);
            setToDelete(null);
            setDeleteError("");
        } catch (e) {
            setDeleteError(e.message);
        }
    };

    const exportCSV = () =>
        downloadCSV(`projects-${todayISO()}.csv`, sorted, [
            ...PROJECT_COLUMNS.map((c) => ({ label: c.label, value: (row) => row[c.key] })),
        ]);

    if (error) return <ErrorState message={error} onRetry={refetch} />;
    if (loading && projects.length === 0) return <LoadingState label="Loading projects…" />;

    const rowOptions = { ...options, statuses: PROJECT_STATUSES };

    return (
        <div className="projects-container">
            <PageHeader
                title="Projects"
                description={`${formatNumber(projects.length)} projects · ${money(sum(projects, (p) => p.amount))} booked in total`}
                actions={
                    <>
                        <button type="button" className={btn.secondary} onClick={exportCSV} disabled={total === 0}>
                            <Download size={15} /> Export CSV
                        </button>
                        <button type="button" className={btn.primary} onClick={table.addNewRow}>
                            <Plus size={16} /> New project
                        </button>
                    </>
                }
            />

            <div className="rounded-xl border border-line bg-surface shadow-[var(--shadow)]">
                <div className="flex flex-col gap-3 border-b border-line p-4">
                    <div className="flex flex-wrap gap-3">
                        <SearchInput
                            value={searchValue}
                            onChange={resetPage(setSearchValue)}
                            placeholder="Search client, service, editor…"
                            className="min-w-[220px] flex-1"
                        />
                        <select
                            className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-accent"
                            value={serviceFilter}
                            onChange={(e) => resetPage(setServiceFilter)(e.target.value)}
                            aria-label="Filter by service"
                        >
                            <option value="All">All services</option>
                            {options.services.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                    <FilterTabs options={statusTabs} value={statusFilter} onChange={resetPage(setStatusFilter)} />
                </div>

                {/* `relative` keeps the absolutely-positioned sr-only header label inside the scroll area */}
                <div className="relative overflow-x-auto">
                    <table className="w-full min-w-[1000px] border-collapse">
                        <thead>
                            <tr className="border-b border-line bg-surface-2">
                                {PROJECT_COLUMNS.map((column) => (
                                    <SortHeader
                                        key={column.key}
                                        label={column.label}
                                        sortKey={column.key}
                                        sort={sort}
                                        onSort={toggleSort}
                                        align={column.align}
                                        className={column.align === "right" ? "text-right" : ""}
                                    />
                                ))}
                                <th className={`${thClass} w-[90px] text-right`}>
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {table.newRows.map((row) => (
                                <NewRow
                                    key={row.tempId}
                                    project={row}
                                    options={rowOptions}
                                    onChange={table.changeNewRow}
                                    onSave={table.saveNewRow}
                                    onCancel={table.cancelNewRow}
                                />
                            ))}

                            {pageRows.map((project) => (
                                <ProjectRow
                                    key={project.id}
                                    project={project}
                                    isEditing={editing.id === project.id}
                                    draft={editing.draft}
                                    focusKey={editing.focusKey}
                                    error={editing.error}
                                    options={rowOptions}
                                    onStartEdit={table.startEdit}
                                    onChange={table.changeDraft}
                                    onSave={table.saveEdit}
                                    onCancel={table.cancelEdit}
                                    onDelete={setToDelete}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {total === 0 && table.newRows.length === 0 && (
                    <EmptyState
                        title="No projects match"
                        message="Try a different search or filter."
                        action={
                            <button
                                type="button"
                                className={btn.secondary}
                                onClick={() => {
                                    setSearchValue("");
                                    setStatusFilter("All");
                                    setServiceFilter("All");
                                }}
                            >
                                Clear filters
                            </button>
                        }
                    />
                )}

                <div className="flex flex-wrap items-center justify-between border-t border-line">
                    <p className="px-4 py-3 text-xs text-muted">Click a row to edit · Enter saves · Esc cancels</p>
                    <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onPageChange={setPage} noun="projects" />
                </div>
            </div>

            {toDelete && (
                <Modal
                    title="Delete this project?"
                    description={`${toDelete.type} for ${toDelete.client} (${money(toDelete.amount)}). This can't be undone.`}
                    onClose={() => {
                        setToDelete(null);
                        setDeleteError("");
                    }}
                    footer={
                        <>
                            <button type="button" className={btn.secondary} onClick={() => setToDelete(null)}>
                                Cancel
                            </button>
                            <button type="button" className={`${btn.primary} !bg-[var(--critical)]`} onClick={confirmDelete}>
                                Delete project
                            </button>
                        </>
                    }
                >
                    {deleteError ? (
                        <p className="text-sm text-critical-ink">{deleteError}</p>
                    ) : (
                        <p className="text-sm text-ink-2">Its invoice (if any) stays on the Invoices page.</p>
                    )}
                </Modal>
            )}
        </div>
    );
}
