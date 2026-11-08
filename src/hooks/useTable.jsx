import { useMemo, useState } from "react";
import { compareValues } from "../utils/dataHelpers";
import { PAGE_SIZE } from "../utils/constants";

/**
 * Sorting + pagination for a list of rows.
 * `getValue(row, key)` lets a column sort by something other than row[key].
 */
export default function useTable(rows, { initialSort = { key: null, dir: "asc" }, pageSize = PAGE_SIZE, getValue } = {}) {
    const [sort, setSort] = useState(initialSort);
    const [page, setPage] = useState(1);

    const sorted = useMemo(() => {
        if (!sort.key) return rows;
        const read = getValue ?? ((row, key) => row[key]);
        const copy = [...rows].sort((a, b) => compareValues(read(a, sort.key), read(b, sort.key)));
        return sort.dir === "desc" ? copy.reverse() : copy;
    }, [rows, sort, getValue]);

    const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const toggleSort = (key) => {
        setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
        setPage(1);
    };

    return {
        sort,
        toggleSort,
        page: currentPage,
        setPage,
        pageCount,
        pageSize,
        pageRows,
        sorted,
        total: sorted.length,
    };
}
