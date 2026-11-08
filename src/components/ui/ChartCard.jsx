import { useState } from "react";
import { BarChart3, Table2 } from "lucide-react";
import Card from "./Card";
import DataTable from "./DataTable";
import { btn } from "./styles";

// A card that holds a chart, with a toggle to see the same numbers as a table.
// table: { columns, rows } — see DataTable.
export default function ChartCard({ title, subtitle, table, actions, children, className = "" }) {
    const [view, setView] = useState("chart");

    const toggle = table && (
        <div className="flex rounded-lg border border-line p-0.5" role="group" aria-label="Switch view">
            <button
                type="button"
                className={`${btn.icon} size-7 ${view === "chart" ? "bg-hover text-ink" : ""}`}
                onClick={() => setView("chart")}
                aria-pressed={view === "chart"}
                title="Chart view"
            >
                <BarChart3 size={15} />
            </button>
            <button
                type="button"
                className={`${btn.icon} size-7 ${view === "table" ? "bg-hover text-ink" : ""}`}
                onClick={() => setView("table")}
                aria-pressed={view === "table"}
                title="Table view"
            >
                <Table2 size={15} />
            </button>
        </div>
    );

    return (
        <Card
            title={title}
            subtitle={subtitle}
            className={className}
            actions={
                (actions || toggle) && (
                    <>
                        {actions}
                        {toggle}
                    </>
                )
            }
        >
            {view === "table" && table ? <DataTable columns={table.columns} rows={table.rows} /> : children}
        </Card>
    );
}
