// Project pipeline, in order. Colors are CSS variables so they follow light/dark mode.
export const PROJECT_STATUSES = ["Pending", "In Progress", "Review", "Completed"];

export const PROJECT_STATUS_COLORS = {
    Pending: "var(--st-pending)",
    "In Progress": "var(--st-progress)",
    Review: "var(--st-review)",
    Completed: "var(--st-completed)",
};

export const INVOICE_STATUSES = ["Paid", "Pending", "Overdue"];

export const INVOICE_STATUS_COLORS = {
    Paid: "var(--good)",
    Pending: "var(--warning)",
    Overdue: "var(--critical)",
};

// Categorical series colors, always used in this order (never cycled past 4).
export const SERIES_COLORS = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"];

export const DATE_RANGES = [
    { value: "7d", label: "Last 7 days", days: 7, granularity: "day" },
    { value: "30d", label: "Last 30 days", days: 30, granularity: "day" },
    { value: "90d", label: "Last 3 months", days: 90, granularity: "week" },
    { value: "12m", label: "Last 12 months", days: 365, granularity: "month" },
];

export const CURRENCIES = ["USD", "EUR", "GBP", "EGP", "AED", "SAR"];

export const PAGE_SIZE = 12;

// Used until /settings loads (or if the API is down), so the UI never shows blanks.
export const DEFAULT_SETTINGS = {
    studioName: "Avaris Studio",
    ownerName: "Samy Adel",
    email: "",
    phone: "",
    address: "",
    currency: "USD",
    taxRate: 14,
    invoiceDueDays: 14,
    monthlyRevenueGoal: 12000,
};
