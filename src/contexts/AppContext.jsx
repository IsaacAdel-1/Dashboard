import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import useFetch from "../hooks/useFetch";
import useLocalStorage from "../hooks/useLocalStorage";
import { api, ENDPOINTS } from "../services/api";
import { formatMoney } from "../utils/dataHelpers";
import { DEFAULT_SETTINGS } from "../utils/constants";

const AppContext = createContext(null);

/**
 * App-wide state that many pages need:
 * - range:    the date range picked in the header (Dashboard + Analytics use it)
 * - theme:    "light" | "dark" | "system", remembered in localStorage
 * - settings: studio profile from the data layer (/settings)
 * - money():  formats a number in the studio's currency
 */
export function AppProvider({ children }) {
    const [range, setRange] = useLocalStorage("avaris.range", "30d");
    const [theme, setTheme] = useLocalStorage("avaris.theme", "system");
    const { response, setResponse, loading: settingsLoading, error: settingsError } = useFetch({
        url: ENDPOINTS.settings,
        initialData: DEFAULT_SETTINGS,
    });
    const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...response }), [response]);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === "system") root.removeAttribute("data-theme");
        else root.setAttribute("data-theme", theme);
    }, [theme]);

    const saveSettings = useCallback(
        async (values) => {
            const saved = await api.put(ENDPOINTS.settings, values);
            setResponse(saved);
            return saved;
        },
        [setResponse]
    );

    const money = useCallback((value, options) => formatMoney(value, settings.currency, options), [settings.currency]);

    const value = {
        range,
        setRange,
        theme,
        setTheme,
        settings,
        settingsLoading,
        settingsError,
        saveSettings,
        money,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used inside <AppProvider>");
    return context;
};
