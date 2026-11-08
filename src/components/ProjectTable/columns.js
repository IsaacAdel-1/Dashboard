// Column definitions for the projects table. Each column says how to edit it:
// "select" uses one of the option lists from useProjectsTable (optionsKey).
export const PROJECT_COLUMNS = [
    { key: "client", label: "Client", input: "select", optionsKey: "clients", minWidth: 170 },
    { key: "type", label: "Service", input: "select", optionsKey: "services", minWidth: 140 },
    { key: "editor", label: "Editor", input: "select", optionsKey: "editors", minWidth: 140 },
    { key: "status", label: "Status", input: "select", optionsKey: "statuses", minWidth: 130 },
    { key: "date", label: "Start date", input: "date", minWidth: 140 },
    { key: "dueDate", label: "Due date", input: "date", minWidth: 140 },
    { key: "amount", label: "Amount", input: "number", align: "right", minWidth: 100 },
];
