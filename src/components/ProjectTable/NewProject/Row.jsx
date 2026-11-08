import { Check, X } from "lucide-react";
import TableCell from "../Project/Cell";
import { PROJECT_COLUMNS } from "../columns";
import { btn } from "../../ui/styles";

/**
 * A project that isn't saved yet. Enter or ✓ saves it (and shows what's missing),
 * Escape or ✕ removes it. Leaving the row saves it only if it's complete.
 */
const NewRow = ({ project, options, onChange, onSave, onCancel }) => {
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onSave(project);
        } else if (e.key === "Escape") {
            onCancel(project.tempId);
        }
    };

    return (
        <>
            <tr
                onKeyDown={handleKeyDown}
                onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) onSave(project, { silent: true });
                }}
                className="border-b border-line bg-accent-soft/40"
            >
                {PROJECT_COLUMNS.map((column, index) => (
                    <TableCell
                        key={column.key}
                        column={column}
                        value={project[column.key]}
                        editing
                        options={options[column.optionsKey]}
                        onChange={(value) => onChange(project.tempId, column.key, value)}
                        autoFocus={index === 0}
                    />
                ))}
                <td className="px-2 py-2 text-right whitespace-nowrap">
                    <button type="button" className={btn.icon} onMouseDown={(e) => e.preventDefault()} onClick={() => onSave(project)} title="Save (Enter)" aria-label="Save new project">
                        <Check size={16} />
                    </button>
                    <button type="button" className={btn.icon} onMouseDown={(e) => e.preventDefault()} onClick={() => onCancel(project.tempId)} title="Discard (Esc)" aria-label="Discard new project">
                        <X size={16} />
                    </button>
                </td>
            </tr>
            {project.error && (
                <tr>
                    <td colSpan={PROJECT_COLUMNS.length + 1} className="px-4 pb-3 text-xs text-critical-ink" role="alert">
                        {project.error}
                    </td>
                </tr>
            )}
        </>
    );
};

export default NewRow;
