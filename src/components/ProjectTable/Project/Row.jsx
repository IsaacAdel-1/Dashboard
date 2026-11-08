import { Check, Pencil, Trash2, X } from "lucide-react";
import TableCell from "./Cell";
import { PROJECT_COLUMNS } from "../columns";
import { btn } from "../../ui/styles";

/**
 * A saved project. Click a cell (or press Enter on the row) to edit it.
 * While editing: Enter or ✓ saves, Escape or ✕ cancels, and moving focus out
 * of the row saves too (like a spreadsheet).
 */
const ProjectRow = ({ project, isEditing, draft, focusKey, error, options, onStartEdit, onChange, onSave, onCancel, onDelete }) => {
    const row = isEditing ? draft : project;

    const handleClick = (e) => {
        if (isEditing) return;
        onStartEdit(project, e.target.closest("td")?.dataset.col);
    };

    const handleKeyDown = (e) => {
        if (!isEditing) {
            if (e.key === "Enter" && e.target === e.currentTarget) onStartEdit(project);
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            onSave();
        } else if (e.key === "Escape") {
            onCancel();
        }
    };

    // Save when focus leaves the row, but not when it just moves to another
    // cell or button inside the same row (relatedTarget = where focus went).
    const handleBlur = (e) => {
        if (isEditing && !e.currentTarget.contains(e.relatedTarget)) onSave();
    };

    return (
        <>
            <tr
                tabIndex={isEditing ? -1 : 0}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className={`border-b border-line outline-none ${isEditing ? "bg-accent-soft/40" : "cursor-pointer hover:bg-hover focus-visible:bg-hover"}`}
            >
                {PROJECT_COLUMNS.map((column) => (
                    <TableCell
                        key={column.key}
                        column={column}
                        value={row[column.key]}
                        editing={isEditing}
                        options={options[column.optionsKey]}
                        onChange={(value) => onChange(column.key, value)}
                        autoFocus={isEditing && focusKey === column.key}
                    />
                ))}
                <td className="px-2 py-2 text-right whitespace-nowrap">
                    {isEditing ? (
                        <>
                            {/* preventDefault on mousedown keeps focus in the input, so clicking
                                these buttons doesn't trigger the row's blur-save first */}
                            <button type="button" className={btn.icon} onMouseDown={(e) => e.preventDefault()} onClick={onSave} title="Save (Enter)" aria-label="Save changes">
                                <Check size={16} />
                            </button>
                            <button type="button" className={btn.icon} onMouseDown={(e) => e.preventDefault()} onClick={onCancel} title="Cancel (Esc)" aria-label="Cancel editing">
                                <X size={16} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                className={btn.icon}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStartEdit(project);
                                }}
                                aria-label={`Edit ${project.client} project`}
                                title="Edit"
                            >
                                <Pencil size={15} />
                            </button>
                            <button
                                type="button"
                                className={`${btn.icon} hover:text-critical-ink`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(project);
                                }}
                                aria-label={`Delete ${project.client} project`}
                                title="Delete"
                            >
                                <Trash2 size={15} />
                            </button>
                        </>
                    )}
                </td>
            </tr>
            {isEditing && error && (
                <tr>
                    <td colSpan={PROJECT_COLUMNS.length + 1} className="px-4 pb-3 text-xs text-critical-ink" role="alert">
                        {error}
                    </td>
                </tr>
            )}
        </>
    );
};

export default ProjectRow;
