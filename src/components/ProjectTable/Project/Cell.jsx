import { useApp } from "../../../contexts/AppContext";
import { formatDate } from "../../../utils/dataHelpers";
import { ProjectStatusBadge } from "../../ui/StatusBadge";
import { cellInputClass, tdClass } from "../../ui/styles";

/**
 * One cell of the projects table.
 * - view mode: shows the value nicely (badge for status, money for amount, formatted dates)
 * - edit mode: shows the right input for the column (select / date / number)
 */
const TableCell = ({ column, value, editing, options = [], onChange, autoFocus }) => {
    const { money } = useApp();
    const alignRight = column.align === "right";

    if (!editing) {
        let content = value || <span className="text-muted">—</span>;
        if (column.key === "status") content = <ProjectStatusBadge status={value} />;
        else if (column.input === "date") content = <span className="tabular text-ink-2">{formatDate(value)}</span>;
        else if (column.key === "amount") content = <span className="tabular">{money(value)}</span>;
        else if (column.key === "client") content = <span className="font-medium">{value}</span>;

        return (
            <td data-col={column.key} className={`${tdClass} ${alignRight ? "text-right" : ""}`}>
                {content}
            </td>
        );
    }

    const common = {
        name: column.key,
        value: value ?? "",
        onChange: (e) => onChange(e.target.value),
        autoFocus,
        "aria-label": column.label,
        className: `${cellInputClass} ${alignRight ? "text-right" : ""}`,
    };

    let input;
    if (column.input === "select") {
        // keep the current value selectable even if it isn't in the list anymore
        const list = value && !options.includes(value) ? [value, ...options] : options;
        input = (
            <select {...common}>
                <option value="">Select…</option>
                {list.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        );
    } else if (column.input === "number") {
        input = <input {...common} type="number" min="0" step="5" inputMode="decimal" />;
    } else if (column.input === "date") {
        input = <input {...common} type="date" />;
    } else {
        input = <input {...common} type="text" />;
    }

    return (
        <td data-col={column.key} className="px-2 py-2" style={{ minWidth: column.minWidth }}>
            {input}
        </td>
    );
};

export default TableCell;
