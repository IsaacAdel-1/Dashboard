import { useMemo, useState } from "react";

/**
 * Filters `data` by `searchValue` across the given `keys`.
 *
 * The result is derived with useMemo instead of being copied into state from a
 * useEffect, so it's always in sync with `data` (new rows, edits, deletes) and
 * there's no stale cache to invalidate. `result` is always an array; an empty
 * array means "nothing matched".
 *
 * Pass `keys` as a constant defined outside the component so it doesn't change
 * on every render.
 */
export const useSearch = ({ data, keys }) => {
    const [searchValue, setSearchValue] = useState("");

    const result = useMemo(() => {
        const list = Array.isArray(data) ? data : [];
        const term = searchValue.trim().toLowerCase();
        if (!term) return list;
        return list.filter((item) => keys.some((key) => String(item[key] ?? "").toLowerCase().includes(term)));
    }, [data, keys, searchValue]);

    return { searchValue, setSearchValue, result, isSearching: searchValue.trim() !== "" };
};
