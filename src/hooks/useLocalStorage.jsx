import { useState } from "react";

// useState that remembers its value in localStorage (per browser).
// Reads/writes are wrapped in try/catch because storage can be blocked
// (private mode, disabled site data) and the app must still work.
export default function useLocalStorage(key, defaultValue) {
    const [value, setValue] = useState(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored === null ? defaultValue : JSON.parse(stored);
        } catch {
            return defaultValue;
        }
    });

    const update = (next) => {
        setValue((prev) => {
            const resolved = typeof next === "function" ? next(prev) : next;
            try {
                localStorage.setItem(key, JSON.stringify(resolved));
            } catch {
                /* storage unavailable: keep the value in memory only */
            }
            return resolved;
        });
    };

    return [value, update];
}
