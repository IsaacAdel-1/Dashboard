import { getClientStatus, getInvoiceStatus, todayISO } from "../../utils/dataHelpers";

export const CLIENT_STATUS_COLORS = {
    Active: "var(--good)",
    Inactive: "var(--muted)",
    New: "var(--series-1)",
};

/**
 * Adds numbers to each client by looking at their projects and invoices.
 * Projects/invoices are linked to a client by name.
 * (Counting is done from scratch here, so nothing is double counted.)
 */
export function withClientStats(clients, projects, invoices, today = todayISO()) {
    const stats = new Map(clients.map((c) => [c.name, { projects: 0, revenue: 0, lastProjectDate: null, outstanding: 0, overdue: 0 }]));

    projects.forEach((p) => {
        const s = stats.get(p.client);
        if (!s) return;
        s.projects += 1;
        s.revenue += Number(p.amount) || 0;
        if (!s.lastProjectDate || p.date > s.lastProjectDate) s.lastProjectDate = p.date;
    });

    invoices.forEach((inv) => {
        const s = stats.get(inv.client);
        if (!s || inv.paidDate) return;
        s.outstanding += inv.total;
        if (getInvoiceStatus(inv, today) === "Overdue") s.overdue += inv.total;
    });

    return clients.map((client) => {
        const s = stats.get(client.name);
        return { ...client, ...s, status: getClientStatus(s.lastProjectDate, today) };
    });
}
