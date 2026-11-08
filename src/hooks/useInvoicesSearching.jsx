import { useMemo, useState } from "react";
import { useCollections } from "./useFetch";
import { useSearch } from "./useSearch";
import { api, ENDPOINTS } from "../services/api";
import { addDays, getInvoiceStatus, todayISO } from "../utils/dataHelpers";

const URLS = { invoices: ENDPOINTS.invoices, projects: ENDPOINTS.projects };
const SEARCH_KEYS = ["number", "client", "service", "status"];

/**
 * Everything the Invoices page needs:
 * invoices with a computed status (Paid / Pending / Overdue), search,
 * a status filter, and actions to mark an invoice as paid or create one.
 */
export const useInvoicesSearching = () => {
    const { data, setCollection, loading, error, refetch } = useCollections(URLS);
    const [statusFilter, setStatusFilter] = useState("All");

    // The status isn't stored: it's worked out from paidDate and dueDate,
    // so an unpaid invoice turns "Overdue" by itself once its due date passes.
    const invoices = useMemo(() => {
        const today = todayISO();
        return data.invoices.map((inv) => ({ ...inv, status: getInvoiceStatus(inv, today) }));
    }, [data.invoices]);

    const { searchValue, setSearchValue, result: searched } = useSearch({ data: invoices, keys: SEARCH_KEYS });

    const result = useMemo(
        () => (statusFilter === "All" ? searched : searched.filter((inv) => inv.status === statusFilter)),
        [searched, statusFilter]
    );

    // Completed projects that don't have an invoice yet
    const billableProjects = useMemo(() => {
        const invoiced = new Set(data.invoices.map((inv) => inv.projectId));
        return data.projects.filter((p) => p.status === "Completed" && !invoiced.has(p.id));
    }, [data.invoices, data.projects]);

    const markAsPaid = async (invoice, { paidDate, method }) => {
        const saved = await api.patch(`${ENDPOINTS.invoices}/${invoice.id}`, { paidDate, method });
        setCollection("invoices", (prev) => prev.map((inv) => (inv.id === saved.id ? saved : inv)));
    };

    const nextInvoiceNumber = (issueDate) => {
        const year = issueDate.slice(0, 4);
        const prefix = `INV-${year}-`;
        const highest = data.invoices
            .filter((inv) => inv.number?.startsWith(prefix))
            .reduce((max, inv) => Math.max(max, Number(inv.number.slice(prefix.length)) || 0), 0);
        return `${prefix}${String(highest + 1).padStart(4, "0")}`;
    };

    const createInvoice = async (project, { taxRate, dueDays, issueDate = todayISO() }) => {
        const amount = Number(project.amount);
        const tax = Math.round(amount * (Number(taxRate) / 100));
        const invoice = {
            number: nextInvoiceNumber(issueDate),
            projectId: project.id,
            client: project.client,
            service: project.type,
            issueDate,
            dueDate: addDays(issueDate, Number(dueDays) || 14),
            amount,
            tax,
            total: amount + tax,
            paidDate: null,
            method: null,
        };
        const created = await api.post(ENDPOINTS.invoices, invoice);
        setCollection("invoices", (prev) => [created, ...prev]);
        return created;
    };

    return {
        invoices,
        result,
        searchValue,
        setSearchValue,
        statusFilter,
        setStatusFilter,
        billableProjects,
        markAsPaid,
        createInvoice,
        loading,
        error,
        refetch,
    };
};
