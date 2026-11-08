import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

/**
 * Fetches `url` and keeps the response in state.
 *
 * - `loading` is derived (not set inside the effect): the request "key" changes,
 *   so until a response for that key arrives we're loading. While a refetch runs
 *   the previous data stays on screen instead of flashing empty.
 * - The AbortController cancels the request when the component unmounts or the
 *   url changes, and AbortError is ignored because it isn't a real failure.
 */
export default function useFetch({ url, initialData = [] }) {
    const [reloadCount, setReloadCount] = useState(0);
    const requestKey = `${url}#${reloadCount}`;
    const [state, setState] = useState({ key: null, data: initialData, error: "" });

    useEffect(() => {
        const controller = new AbortController();
        api.get(url, { signal: controller.signal })
            .then((data) => setState({ key: requestKey, data, error: "" }))
            .catch((e) => {
                if (e.name === "AbortError") return;
                setState((prev) => ({ key: requestKey, data: prev.data, error: e.message }));
            });
        return () => controller.abort();
    }, [url, requestKey]);

    // Same API as useState's setter, so callers can do setResponse(prev => ...)
    const setResponse = useCallback((updater) => {
        setState((prev) => ({
            ...prev,
            data: typeof updater === "function" ? updater(prev.data) : updater,
        }));
    }, []);

    const refetch = useCallback(() => setReloadCount((n) => n + 1), []);

    return {
        response: state.data,
        setResponse,
        error: state.key === requestKey ? state.error : "",
        loading: state.key !== requestKey,
        refetch,
    };
}

/**
 * Loads several endpoints in parallel with one loading/error state:
 *   const { data, loading } = useCollections({ projects: ENDPOINTS.projects, clients: ENDPOINTS.clients })
 *   data.projects, data.clients
 * `setCollection("projects", prev => ...)` updates one of them locally after a save.
 */
export function useCollections(urls) {
    const [reloadCount, setReloadCount] = useState(0);
    const urlsKey = JSON.stringify(urls); // compare by value, not by object identity
    const requestKey = `${urlsKey}#${reloadCount}`;
    const [state, setState] = useState(() => ({
        key: null,
        data: Object.fromEntries(Object.keys(urls).map((name) => [name, []])),
        error: "",
    }));

    useEffect(() => {
        const controller = new AbortController();
        const entries = Object.entries(JSON.parse(urlsKey));
        Promise.all(entries.map(([, url]) => api.get(url, { signal: controller.signal })))
            .then((values) => {
                const data = Object.fromEntries(entries.map(([name], i) => [name, values[i]]));
                setState({ key: requestKey, data, error: "" });
            })
            .catch((e) => {
                if (e.name === "AbortError") return;
                setState((prev) => ({ ...prev, key: requestKey, error: e.message }));
            });
        return () => controller.abort();
    }, [urlsKey, requestKey]);

    const setCollection = useCallback((name, updater) => {
        setState((prev) => ({
            ...prev,
            data: { ...prev.data, [name]: typeof updater === "function" ? updater(prev.data[name]) : updater },
        }));
    }, []);

    const refetch = useCallback(() => setReloadCount((n) => n + 1), []);

    return {
        data: state.data,
        setCollection,
        loading: state.key !== requestKey,
        error: state.key === requestKey ? state.error : "",
        refetch,
    };
}
