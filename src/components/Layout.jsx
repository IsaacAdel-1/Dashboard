import "./Sidebar.css";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BarChart3, FileText, Folder, LayoutGrid, Menu, Monitor, Moon, Settings, Sun, Users, Video } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { DATE_RANGES } from "../utils/constants";
import { getInitials } from "../utils/dataHelpers";
import { btn } from "./ui/styles";

const NAV_LINKS = [
    { to: "/", icon: LayoutGrid, name: "Dashboard", end: true },
    { to: "/projects", icon: Folder, name: "Projects" },
    { to: "/clients", icon: Users, name: "Clients" },
    { to: "/invoices", icon: FileText, name: "Invoices" },
    { to: "/analytics", icon: BarChart3, name: "Analytics" },
    { to: "/settings", icon: Settings, name: "Settings" },
];

// The date range only affects these pages, so the picker is only shown there.
const RANGE_ROUTES = ["/", "/analytics"];

const THEMES = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
];

const SMALL_SCREEN_QUERY = "(max-width: 1023px)";

export default function Layout() {
    const { settings, range, setRange, theme, setTheme } = useApp();
    const location = useLocation();

    const [isSmallScreen, setIsSmallScreen] = useState(() => window.matchMedia(SMALL_SCREEN_QUERY).matches);
    const [sidebarOpen, setSidebarOpen] = useState(() => !window.matchMedia(SMALL_SCREEN_QUERY).matches);

    // Collapse the sidebar to icons on small screens, expand it on large ones.
    // The listener is removed in the cleanup so it isn't added twice.
    useEffect(() => {
        const media = window.matchMedia(SMALL_SCREEN_QUERY);
        const onChange = (e) => {
            setIsSmallScreen(e.matches);
            setSidebarOpen(!e.matches);
        };
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, []);

    const currentTheme = THEMES.find((t) => t.value === theme) ?? THEMES[2];
    const nextTheme = THEMES[(THEMES.indexOf(currentTheme) + 1) % THEMES.length];
    const showRange = RANGE_ROUTES.includes(location.pathname);
    const overlay = isSmallScreen && sidebarOpen;

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface px-4">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        className={`${btn.icon} border border-line`}
                        onClick={() => setSidebarOpen((open) => !open)}
                        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                        aria-expanded={sidebarOpen}
                    >
                        <Menu size={18} />
                    </button>
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                        <Video size={16} />
                    </div>
                    <span className="truncate font-semibold text-ink">{settings.studioName}</span>
                </div>

                <div className="flex items-center gap-2">
                    {showRange && (
                        <select
                            className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-accent"
                            value={range}
                            onChange={(e) => setRange(e.target.value)}
                            aria-label="Date range"
                        >
                            {DATE_RANGES.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    )}
                    <button
                        type="button"
                        className={btn.icon}
                        onClick={() => setTheme(nextTheme.value)}
                        title={`Theme: ${currentTheme.label} (switch to ${nextTheme.label})`}
                        aria-label={`Theme: ${currentTheme.label}. Switch to ${nextTheme.label}`}
                    >
                        <currentTheme.icon size={18} />
                    </button>
                    <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent"
                        title={settings.ownerName}
                    >
                        {getInitials(settings.ownerName)}
                    </div>
                </div>
            </header>

            <div className="relative flex flex-1">
                <nav
                    aria-label="Main"
                    className={`z-20 flex shrink-0 flex-col gap-1 border-r border-line bg-surface py-4 transition-[width] duration-200 ${
                        sidebarOpen ? "w-[220px] px-3" : "w-[64px] items-center px-2"
                    } ${overlay ? "fixed top-14 bottom-0 left-0 shadow-xl" : "sticky top-14 h-[calc(100vh-3.5rem)]"}`}
                >
                    {NAV_LINKS.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            title={sidebarOpen ? undefined : link.name}
                            onClick={() => isSmallScreen && setSidebarOpen(false)}
                            className={({ isActive }) => `link ${isActive ? "link-active" : ""} ${sidebarOpen ? "" : "justify-center"}`}
                        >
                            <link.icon size={19} aria-hidden="true" />
                            {sidebarOpen && <span>{link.name}</span>}
                        </NavLink>
                    ))}
                </nav>

                {overlay && (
                    <div className="fixed inset-x-0 top-14 bottom-0 z-10 bg-[var(--overlay)]" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
                )}

                <main className={`min-w-0 flex-1 bg-page p-6 max-sm:p-4 ${overlay ? "ml-[64px]" : ""}`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
