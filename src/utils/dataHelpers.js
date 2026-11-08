import { DATE_RANGES } from "./constants";

// ---------------------------------------------------------------------------
// Dates. The database stores plain "YYYY-MM-DD" strings, and strings in that
// format compare correctly with < and >, so most checks stay string-based.
// ---------------------------------------------------------------------------

export const toISODate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

export const parseDate = (dateString) => {
    const [y, m, d] = dateString.split("-").map(Number);
    return new Date(y, m - 1, d);
};

export const todayISO = () => toISODate(new Date());

export const addDays = (dateString, days) => {
    const date = parseDate(dateString);
    date.setDate(date.getDate() + days);
    return toISODate(date);
};

export const daysBetween = (from, to) => Math.round((parseDate(to) - parseDate(from)) / 86400000);

export const isInRange = (dateString, start, end) => !!dateString && dateString >= start && dateString <= end;

export const formatDate = (dateString) => {
    if (!dateString) return "—";
    return parseDate(dateString).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

export const formatShortDate = (dateString) =>
    parseDate(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const getRange = (value) => DATE_RANGES.find((r) => r.value === value) ?? DATE_RANGES[1];

// Current period + the period right before it (used for "vs last period").
export const getRangeBounds = (rangeValue, today = todayISO()) => {
    const range = getRange(rangeValue);
    let start;
    if (range.granularity === "month") {
        // 12 whole calendar months, the current (partial) month included
        const d = parseDate(today);
        start = toISODate(new Date(d.getFullYear(), d.getMonth() - 11, 1));
    } else {
        start = addDays(today, -(range.days - 1));
    }
    const length = daysBetween(start, today) + 1;
    const prevEnd = addDays(start, -1);
    const prevStart = addDays(prevEnd, -(length - 1));
    return { start, end: today, prevStart, prevEnd, granularity: range.granularity, label: range.label };
};

// Splits [start, end] into day / week / month buckets for a time-series chart.
export const makeBuckets = (start, end, granularity) => {
    const buckets = [];
    if (granularity === "month") {
        const s = parseDate(start);
        let cursor = new Date(s.getFullYear(), s.getMonth(), 1);
        while (toISODate(cursor) <= end) {
            const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
            buckets.push({
                start: toISODate(cursor),
                end: addDays(toISODate(next), -1),
                label: cursor.toLocaleDateString("en-US", { month: "short" }),
                fullLabel: cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            });
            cursor = next;
        }
        return buckets;
    }
    const step = granularity === "week" ? 7 : 1;
    let cursor = start;
    while (cursor <= end) {
        const bucketEnd = addDays(cursor, step - 1) < end ? addDays(cursor, step - 1) : end;
        buckets.push({
            start: cursor,
            end: bucketEnd,
            label: formatShortDate(cursor),
            fullLabel: step === 1 ? formatDate(cursor) : `${formatShortDate(cursor)} – ${formatShortDate(bucketEnd)}`,
        });
        cursor = addDays(cursor, step);
    }
    return buckets;
};

// series: { fieldName: { items, date: item => dateString, value: item => number } }
export const buildTimeSeries = (buckets, series) =>
    buckets.map((bucket) => {
        const row = { label: bucket.label, fullLabel: bucket.fullLabel };
        Object.entries(series).forEach(([field, { items, date, value = () => 1 }]) => {
            row[field] = items.reduce((sum, item) => {
                const d = date(item);
                return isInRange(d, bucket.start, bucket.end) ? sum + value(item) : sum;
            }, 0);
        });
        return row;
    });

// ---------------------------------------------------------------------------
// Numbers & money
// ---------------------------------------------------------------------------

const moneyFormatters = new Map();
export const formatMoney = (value, currency = "USD", { compact = false, cents = false } = {}) => {
    const key = `${currency}-${compact}-${cents}`;
    if (!moneyFormatters.has(key)) {
        moneyFormatters.set(
            key,
            new Intl.NumberFormat("en-US", {
                style: "currency",
                currency,
                notation: compact ? "compact" : "standard",
                maximumFractionDigits: compact ? 1 : cents ? 2 : 0,
                minimumFractionDigits: 0,
            })
        );
    }
    return moneyFormatters.get(key).format(Number(value) || 0);
};

export const formatNumber = (value) => new Intl.NumberFormat("en-US").format(Number(value) || 0);

export const formatPercent = (value, digits = 0) =>
    `${(Number(value) || 0).toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;

// Returns null when there's nothing to compare against.
export const percentChange = (current, previous) => {
    if (!previous) return null;
    return ((current - previous) / previous) * 100;
};

export const sum = (items, valueFn) => items.reduce((total, item) => total + (Number(valueFn(item)) || 0), 0);

// [{ name, value, count }] sorted by value, biggest first.
export const groupSum = (items, keyFn, valueFn = () => 1) => {
    const groups = new Map();
    items.forEach((item) => {
        const key = keyFn(item) || "Unassigned";
        const group = groups.get(key) ?? { name: key, value: 0, count: 0 };
        group.value += Number(valueFn(item)) || 0;
        group.count += 1;
        groups.set(key, group);
    });
    return [...groups.values()].sort((a, b) => b.value - a.value);
};

// ---------------------------------------------------------------------------
// Domain helpers
// ---------------------------------------------------------------------------

export const getInitials = (name = "") => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "?";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
};

export const getInvoiceStatus = (invoice, today = todayISO()) => {
    if (invoice.paidDate) return "Paid";
    return invoice.dueDate < today ? "Overdue" : "Pending";
};

// A client is "Active" when they had a project in the last 90 days.
export const getClientStatus = (lastProjectDate, today = todayISO()) => {
    if (!lastProjectDate) return "New";
    return daysBetween(lastProjectDate, today) <= 90 ? "Active" : "Inactive";
};

export const isValidProject = (project) =>
    Boolean(project.client?.trim() && project.type?.trim() && project.date && Number(project.amount) > 0);

export const compareValues = (a, b) => {
    if (a == null || a === "") return 1;
    if (b == null || b === "") return -1;
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b), "en", { numeric: true, sensitivity: "base" });
};

// Builds a CSV file in the browser and downloads it.
export const downloadCSV = (filename, rows, columns) => {
    const escape = (value) => {
        const text = value == null ? "" : String(value);
        return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const header = columns.map((c) => escape(c.label)).join(",");
    const lines = rows.map((row) => columns.map((c) => escape(c.value(row))).join(","));
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};
