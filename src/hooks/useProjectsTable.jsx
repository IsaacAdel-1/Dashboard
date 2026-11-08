import { useRef, useState } from "react";
import { useCollections } from "./useFetch";
import { api, ENDPOINTS } from "../services/api";
import { addDays, isValidProject, todayISO } from "../utils/dataHelpers";

const URLS = {
    projects: ENDPOINTS.projects,
    clients: ENDPOINTS.clients,
    services: ENDPOINTS.services,
    team: ENDPOINTS.team,
};

const FIELDS = ["client", "type", "editor", "status", "date", "dueDate", "amount"];
const INVALID_MESSAGE = "Client, service, start date and an amount above 0 are required.";

// Only the fields we store (drops helper keys like tempId / error).
const toRecord = (row) => ({
    client: row.client.trim(),
    type: row.type,
    editor: row.editor ?? "",
    status: row.status || "Pending",
    date: row.date,
    dueDate: row.dueDate ?? "",
    amount: Number(row.amount),
});

const hasChanges = (original, draft) => FIELDS.some((f) => String(original?.[f] ?? "") !== String(draft[f] ?? ""));

const useProjectsTable = () => {
    const { data, setCollection, loading, error, refetch } = useCollections(URLS);
    const { projects, clients, services, team } = data;

    // Editing works on a copy (draft) so Escape can throw the changes away
    // and the list only changes after the server accepted the update.
    const [editing, setEditing] = useState({ id: null, draft: null, focusKey: null, error: "" });
    const [newRows, setNewRows] = useState([]);
    // tempIds of new rows being POSTed right now, so one row is never created twice
    const savingNewRows = useRef(new Set());

    // When a service and a start date are picked and there's no due date yet,
    // suggest one from the service's usual turnaround time.
    const applyChange = (row, name, value) => {
        const next = { ...row, [name]: value };
        if ((name === "type" || name === "date") && !row.dueDate && next.type && next.date) {
            const service = services.find((s) => s.name === next.type);
            if (service) next.dueDate = addDays(next.date, service.turnaroundDays);
        }
        if (name === "type" && !row.amount) {
            const service = services.find((s) => s.name === value);
            if (service) next.amount = service.basePrice;
        }
        return next;
    };

    // ---------- existing rows ----------
    const startEdit = (project, focusKey) => {
        if (editing.id === project.id) return;
        setEditing({ id: project.id, draft: { ...project }, focusKey: focusKey ?? FIELDS[0], error: "" });
    };

    const changeDraft = (name, value) => {
        setEditing((prev) => ({ ...prev, draft: applyChange(prev.draft, name, value), error: "" }));
    };

    // Only close the editor if it's still showing the same row
    // (the user may have clicked another row while a save was in flight).
    const closeEdit = (id) => {
        setEditing((prev) => (prev.id === id ? { id: null, draft: null, focusKey: null, error: "" } : prev));
    };

    const cancelEdit = () => closeEdit(editing.id);

    const saveEdit = async () => {
        const { id, draft } = editing;
        if (!draft) return;
        const original = projects.find((p) => p.id === id);
        if (!hasChanges(original, draft)) return closeEdit(id);
        if (!isValidProject(draft)) {
            setEditing((prev) => ({ ...prev, error: INVALID_MESSAGE }));
            return;
        }
        try {
            const saved = await api.put(`${ENDPOINTS.projects}/${id}`, toRecord(draft));
            setCollection("projects", (prev) => prev.map((p) => (p.id === id ? saved : p)));
            closeEdit(id);
        } catch (e) {
            setEditing((prev) => (prev.id === id ? { ...prev, error: e.message } : prev));
        }
    };

    const deleteProject = async (project) => {
        await api.remove(`${ENDPOINTS.projects}/${project.id}`);
        setCollection("projects", (prev) => prev.filter((p) => p.id !== project.id));
        closeEdit(project.id);
    };

    // ---------- new rows ----------
    const addNewRow = () => {
        const emptyRow = {
            tempId: crypto.randomUUID(),
            client: "",
            type: "",
            editor: "",
            status: "Pending",
            date: todayISO(),
            dueDate: "",
            amount: "",
            error: "",
        };
        setNewRows((prev) => [emptyRow, ...prev]);
    };

    const updateNewRow = (tempId, changes) => {
        setNewRows((prev) => prev.map((row) => (row.tempId === tempId ? { ...row, ...changes } : row)));
    };

    const changeNewRow = (tempId, name, value) => {
        setNewRows((prev) => prev.map((row) => (row.tempId === tempId ? { ...applyChange(row, name, value), error: "" } : row)));
    };

    const cancelNewRow = (tempId) => setNewRows((prev) => prev.filter((row) => row.tempId !== tempId));

    // silent = true is used on blur: save if the row is complete, otherwise leave it open quietly.
    const saveNewRow = async (row, { silent = false } = {}) => {
        if (savingNewRows.current.has(row.tempId)) return; // a save for this row is already running
        if (!isValidProject(row)) {
            if (!silent) updateNewRow(row.tempId, { error: INVALID_MESSAGE });
            return;
        }
        savingNewRows.current.add(row.tempId);
        try {
            const created = await api.post(ENDPOINTS.projects, toRecord(row));
            setCollection("projects", (prev) => [created, ...prev]);
            cancelNewRow(row.tempId);
        } catch (e) {
            updateNewRow(row.tempId, { error: e.message });
        } finally {
            savingNewRows.current.delete(row.tempId);
        }
    };

    const options = {
        clients: clients.map((c) => c.name).sort(),
        services: services.map((s) => s.name),
        editors: team.filter((m) => m.role !== "Project Manager").map((m) => m.name),
    };

    return {
        projects,
        options,
        loading,
        error,
        refetch,
        editing,
        startEdit,
        changeDraft,
        cancelEdit,
        saveEdit,
        deleteProject,
        newRows,
        addNewRow,
        changeNewRow,
        cancelNewRow,
        saveNewRow,
    };

    // مينفعش اخلي القوس المعوج بعد ال return
    // في الصف اللي تحتها لان فيه حاجة في ال js اسمها automatic Semicolon Insertion يعني فيه Semicolon هتتعمل بشكل تلقائي بعد ال return
    // و هتقفل ال return من غير ما تبعت حاجة
};

export default useProjectsTable;
